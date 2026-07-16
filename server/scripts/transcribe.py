import sys
import json
import os
import argparse
import shutil
import traceback
import time

# Force stdout to use utf-8 encoding on Windows to prevent UnicodeEncodeError
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')


# ---------------------------------------------------------------------------
# FFmpeg resolution — read from .env first, then fall back to system PATH
# ---------------------------------------------------------------------------

def get_env_ffmpeg_path():
    """Reads FFMPEG_PATH from .env file."""
    env_paths = [
        os.path.join(os.getcwd(), '.env'),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    ]
    for env_path in env_paths:
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith('FFMPEG_PATH='):
                            return line.split('=', 1)[1].strip(' "\'')
            except Exception:
                pass
    return os.environ.get("FFMPEG_PATH")


def find_ffmpeg():
    """Find ffmpeg from .env or fallback to system PATH."""
    env_ffmpeg = get_env_ffmpeg_path()
    if env_ffmpeg and os.path.exists(env_ffmpeg) and os.path.isfile(env_ffmpeg):
        return env_ffmpeg
    return shutil.which("ffmpeg")


# Resolve FFmpeg and inject into PATH before loading anything else
resolved_ffmpeg_path = find_ffmpeg()
if resolved_ffmpeg_path:
    ffmpeg_dir = os.path.dirname(resolved_ffmpeg_path)
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def return_error(message, details=None):
    """Formats and prints JSON error, then exits cleanly for Node to parse."""
    error_obj = {'success': False, 'error': message}
    if details:
        error_obj['details'] = details
    print(json.dumps(error_obj, ensure_ascii=False))
    sys.exit(0)


def get_diagnostics(file_path):
    return {
        'python_executable': sys.executable,
        'cwd': os.getcwd(),
        'ffmpeg_path_env': get_env_ffmpeg_path() or 'Not Set',
        'shutil_which_ffmpeg': shutil.which('ffmpeg') or 'Not Found',
        'resolved_ffmpeg_path': resolved_ffmpeg_path or 'Not Found',
        'audio_file_absolute': file_path,
        'audio_file_exists': os.path.exists(file_path),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='Transcribe audio/video using faster-whisper')
    parser.add_argument('file_path', type=str, help='Path to audio/video file')
    parser.add_argument('--model', type=str, default='base',
                        help='Whisper model size (tiny, base, small, medium, large-v3)')
    parser.add_argument('--language', type=str, default=None,
                        help='Language code (e.g., en, es, fr). None for auto-detect.')
    args = parser.parse_args()

    # 1. Resolve absolute path
    file_path = os.path.abspath(args.file_path)
    diagnostics = get_diagnostics(file_path)

    # 2. Verify file exists
    if not os.path.exists(file_path):
        return_error(
            f"Missing audio file: The file '{file_path}' does not exist on disk.",
            details=diagnostics,
        )
    if not os.path.isfile(file_path):
        return_error(
            f"Invalid path: '{file_path}' is a directory or invalid file.",
            details=diagnostics,
        )

    # 3. Verify FFmpeg was found
    if not resolved_ffmpeg_path:
        return_error(
            "Missing ffmpeg: ffmpeg.exe was not found via FFMPEG_PATH in .env or system PATH.",
            details={
                **diagnostics,
                'fix': 'Set FFMPEG_PATH in .env to the absolute path of ffmpeg.exe, or add ffmpeg to your system PATH.',
            },
        )

    # 4. Import faster-whisper (fall back to openai-whisper if missing)
    use_faster = True
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        use_faster = False
        try:
            import whisper
        except ImportError:
            return_error(
                "Missing whisper: Neither faster-whisper nor openai-whisper is installed.",
                details={
                    **diagnostics,
                    'fix': 'Run: pip install faster-whisper   (recommended) or pip install openai-whisper',
                },
            )

    # 5. Transcribe
    try:
        start_time = time.time()

        if use_faster:
            # ---- faster-whisper path (CTranslate2, int8 on CPU) ----
            model = WhisperModel(
                args.model,
                device="cpu",
                compute_type="int8",          # ~2x faster on CPU vs float32
                cpu_threads=os.cpu_count(),    # use all cores
            )

            transcribe_opts = {
                "beam_size": 1,               # greedy decoding — fastest
                "vad_filter": True,            # skip silence — big speedup
                "vad_parameters": {
                    "min_silence_duration_ms": 500,
                },
            }
            if args.language:
                transcribe_opts["language"] = args.language

            segments_gen, info = model.transcribe(file_path, **transcribe_opts)

            total_duration = info.duration
            
            segments_list = []
            for seg in segments_gen:
                segments_list.append({
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip(),
                })
                # Emit progress for Node.js to read
                if total_duration > 0:
                    progress = min(100.0, (seg.end / total_duration) * 100)
                    print(f"PROGRESS: {progress:.1f}")
                    sys.stdout.flush()

            text = " ".join(s["text"] for s in segments_list)
            detected_language = info.language or "en"
            duration = segments_list[-1]["end"] if segments_list else 0

        else:
            # ---- openai-whisper fallback ----
            model = whisper.load_model(args.model)

            transcribe_opts = {}
            if args.language:
                transcribe_opts["language"] = args.language

            result = model.transcribe(file_path, **transcribe_opts)

            text = result.get("text", "").strip()
            detected_language = result.get("language", "en")
            segments = result.get("segments", [])
            duration = segments[-1].get("end", 0) if segments else 0

        elapsed = round(time.time() - start_time, 2)

        output = {
            "success": True,
            "text": text,
            "language": detected_language,
            "duration": round(duration, 2),
            "wordCount": len(text.split()) if text else 0,
            "engine": "faster-whisper" if use_faster else "openai-whisper",
            "processingTime": elapsed,
            "diagnostics": diagnostics,
        }

        print(json.dumps(output, ensure_ascii=False))
        sys.exit(0)

    except Exception as e:
        error_msg = str(e)
        if "[WinError 2]" in error_msg or isinstance(e, FileNotFoundError):
            return_error(
                "Missing ffmpeg or subprocess dependency: Whisper failed to execute the background ffmpeg command.",
                details={"traceback": traceback.format_exc(), **diagnostics},
            )

        return_error(
            f"Transcription runtime error: {error_msg}",
            details={"traceback": traceback.format_exc(), **diagnostics},
        )


if __name__ == '__main__':
    main()
