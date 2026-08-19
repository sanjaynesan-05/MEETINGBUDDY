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
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
    diagnostics = {
        'python_executable': sys.executable,
        'cwd': os.getcwd(),
        'ffmpeg_path_env': get_env_ffmpeg_path() or 'Not Set',
        'shutil_which_ffmpeg': shutil.which('ffmpeg') or 'Not Found',
        'resolved_ffmpeg_path': resolved_ffmpeg_path or 'Not Found',
        'audio_file_absolute': file_path,
        'audio_file_exists': os.path.exists(file_path),
        'audio_file_size_bytes': file_size,
        'audio_file_size_mb': round(file_size / (1024 * 1024), 2),
    }
    return diagnostics


def print_diagnostics(file_path):
    """Print diagnostics to stderr so it does not corrupt the progress protocol."""
    d = get_diagnostics(file_path)
    for key, value in d.items():
        print(f"DIAGNOSTICS: {key}={value}", file=sys.stderr)


def print_status(status):
    """Print a STATUS line to stdout for the Node layer to consume."""
    print(f"STATUS:{status}")
    sys.stdout.flush()


# ---------------------------------------------------------------------------
# GPU / Device selection
# ---------------------------------------------------------------------------

def detect_gpu_info():
    """
    Detect GPU information using PyTorch (informational only).
    Returns (gpu_name, cuda_version, torch_cuda_available) or None values.
    """
    gpu_name = None
    cuda_version = None
    torch_cuda_available = False
    try:
        import torch
        torch_cuda_available = torch.cuda.is_available()
        if torch_cuda_available:
            gpu_name = torch.cuda.get_device_name(0)
            cuda_version = torch.version.cuda
    except Exception:
        pass
    return gpu_name, cuda_version, torch_cuda_available


def select_device(model_name="large-v3-turbo"):
    """
    Safely select the best available device for faster-whisper/CTranslate2.

    Strategy:
      1. Try CUDA with float16 (fastest on RTX 3050).
      2. Verify CTranslate2 can actually see the CUDA device.
      3. Attempt WhisperModel initialization on CUDA with the requested model.
      4. If ANY step fails, fall back to CPU with int8.

    Returns a dict with device, compute_type, cpu_threads, and diagnostics info.
    """
    device_info = {
        'device': 'cpu',
        'compute_type': 'int8',
        'cpu_threads': os.cpu_count(),
        'gpu_name': None,
        'cuda_version': None,
        'torch_cuda_available': False,
        'ct2_cuda_device_count': 0,
        'gpu_fallback_reason': None,
        'gpu_attempted': False,
    }

    # --- Informational GPU detection via PyTorch ---
    gpu_name, cuda_version, torch_cuda_available = detect_gpu_info()
    device_info['gpu_name'] = gpu_name
    device_info['cuda_version'] = cuda_version
    device_info['torch_cuda_available'] = torch_cuda_available

    # --- Verify CTranslate2 CUDA support (this is what faster-whisper actually uses) ---
    try:
        import ctranslate2
        device_info['ct2_version'] = getattr(ctranslate2, '__version__', 'unknown')
        try:
            device_info['ct2_cuda_device_count'] = ctranslate2.get_cuda_device_count()
        except Exception as e:
            device_info['ct2_cuda_device_count'] = 0
            device_info['gpu_fallback_reason'] = f"ctranslate2.get_cuda_device_count() failed: {e}"
            print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
            return device_info

        if device_info['ct2_cuda_device_count'] <= 0:
            device_info['gpu_fallback_reason'] = (
                "CTranslate2 reports 0 CUDA devices. "
                "PyTorch may see CUDA but CTranslate2 cannot — falling back to CPU."
            )
            print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
            return device_info

        # Verify float16 is a supported compute type for CUDA
        try:
            supported_types = ctranslate2.get_supported_compute_types('cuda')
            if 'float16' not in supported_types:
                device_info['gpu_fallback_reason'] = (
                    f"float16 not supported by CTranslate2 CUDA build. "
                    f"Supported: {supported_types}. Falling back to CPU."
                )
                print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
                return device_info
        except Exception as e:
            device_info['gpu_fallback_reason'] = (
                f"ctranslate2.get_supported_compute_types('cuda') failed: {e}. Falling back to CPU."
            )
            print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
            return device_info

    except ImportError:
        device_info['gpu_fallback_reason'] = "ctranslate2 not importable. Falling back to CPU."
        print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
        return device_info
    except Exception as e:
        device_info['gpu_fallback_reason'] = f"ctranslate2 import/query error: {e}. Falling back to CPU."
        print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
        return device_info

    # --- Attempt CUDA initialization with faster-whisper ---
    device_info['gpu_attempted'] = True
    try:
        from faster_whisper import WhisperModel
        # Attempt to initialize the model on CUDA. This is the definitive test —
        # it verifies that CTranslate2 can actually load CUDA libraries and
        # allocate GPU memory for the requested model.
        _probe_model = WhisperModel(
            model_name,
            device="cuda",
            compute_type="float16",
        )
        del _probe_model  # Release GPU memory immediately

        # Success — use CUDA
        device_info['device'] = 'cuda'
        device_info['compute_type'] = 'float16'
        device_info['cpu_threads'] = None  # Not used in GPU mode
        print("DIAGNOSTICS: gpu_initialization=success", file=sys.stderr)
        return device_info

    except Exception as e:
        device_info['gpu_fallback_reason'] = (
            f"WhisperModel CUDA initialization failed: {type(e).__name__}: {e}. "
            f"Falling back to CPU."
        )
        print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
        return device_info


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
    parser.add_argument('--diarize', action='store_true',
                        help='Enable speaker diarization with pyannote.audio')
    parser.add_argument('--hf-token', type=str, default=None,
                        help='HuggingFace token for pyannote.audio models')
    args = parser.parse_args()

    # 1. Resolve absolute path
    file_path = os.path.abspath(args.file_path)
    diagnostics = get_diagnostics(file_path)

    # 2. Verify file exists
    if not os.path.exists(file_path):
        print_diagnostics(file_path)
        return_error(
            f"Missing audio file: The file '{file_path}' does not exist on disk.",
            details=diagnostics,
        )
    if not os.path.isfile(file_path):
        print_diagnostics(file_path)
        return_error(
            f"Invalid path: '{file_path}' is a directory or invalid file.",
            details=diagnostics,
        )

    # 3. Verify FFmpeg was found
    if not resolved_ffmpeg_path:
        print_diagnostics(file_path)
        return_error(
            "Missing ffmpeg: ffmpeg.exe was not found via FFMPEG_PATH in .env or system PATH.",
            details={
                **diagnostics,
                'fix': 'Set FFMPEG_PATH in .env to the absolute path of ffmpeg.exe, or add ffmpeg to your system PATH.',
            },
        )

    # Print diagnostics to stderr (does not interfere with progress protocol)
    print_diagnostics(file_path)

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

        # Default device info (used by openai-whisper fallback path)
        device = "cpu"
        compute_type = "int8"
        device_info = {
            'device': device,
            'compute_type': compute_type,
            'gpu_name': None,
            'cuda_version': None,
            'torch_cuda_available': False,
            'ct2_cuda_device_count': 0,
            'gpu_fallback_reason': None,
        }

        if use_faster:
            # ---- faster-whisper path (CTranslate2) ----
            print_status("MODEL_LOADING")

            # --- Safe automatic device selection ---
            device_info = select_device(args.model)
            device = device_info['device']
            compute_type = device_info['compute_type']
            cpu_threads = device_info['cpu_threads']

            # Emit device diagnostics to stderr
            print(f"DIAGNOSTICS: model={args.model}", file=sys.stderr)
            print(f"DIAGNOSTICS: device={device}", file=sys.stderr)
            print(f"DIAGNOSTICS: compute_type={compute_type}", file=sys.stderr)
            if device_info.get('gpu_name'):
                print(f"DIAGNOSTICS: gpu={device_info['gpu_name']}", file=sys.stderr)
            if device_info.get('cuda_version'):
                print(f"DIAGNOSTICS: cuda_version={device_info['cuda_version']}", file=sys.stderr)
            if device_info.get('ct2_version'):
                print(f"DIAGNOSTICS: ctranslate2_version={device_info['ct2_version']}", file=sys.stderr)
            if device_info.get('torch_cuda_available') is not None:
                print(f"DIAGNOSTICS: torch_cuda_available={device_info['torch_cuda_available']}", file=sys.stderr)
            if device_info.get('ct2_cuda_device_count') is not None:
                print(f"DIAGNOSTICS: ct2_cuda_device_count={device_info['ct2_cuda_device_count']}", file=sys.stderr)
            if device_info.get('gpu_fallback_reason'):
                print(f"DIAGNOSTICS: gpu_fallback_reason={device_info['gpu_fallback_reason']}", file=sys.stderr)
            if cpu_threads:
                print(f"DIAGNOSTICS: cpu_threads={cpu_threads}", file=sys.stderr)

            # Import faster-whisper version for diagnostics
            try:
                import faster_whisper as fw
                print(f"DIAGNOSTICS: faster_whisper_version={getattr(fw, '__version__', 'unknown')}", file=sys.stderr)
            except Exception:
                pass

            # Build model kwargs
            model_kwargs = {
                "device": device,
                "compute_type": compute_type,
            }
            if device == "cpu" and cpu_threads:
                model_kwargs["cpu_threads"] = cpu_threads

            model = WhisperModel(args.model, **model_kwargs)

            transcribe_opts = {
                "beam_size": 1,               # greedy decoding — fastest
                "vad_filter": True,            # skip silence — big speedup
                "vad_parameters": {
                    "min_silence_duration_ms": 500,
                },
            }
            if args.language:
                transcribe_opts["language"] = args.language

            print_status("TRANSCRIBING")
            segments_gen, info = model.transcribe(file_path, **transcribe_opts)

            total_duration = info.duration
            print(f"DIAGNOSTICS: audio_duration_seconds={total_duration}", file=sys.stderr)
            print(f"DIAGNOSTICS: detected_language={info.language or 'unknown'}", file=sys.stderr)

            segments_list = []
            last_progress = -1.0
            for seg in segments_gen:
                segments_list.append({
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip(),
                })
                # Emit progress for Node.js to read
                if total_duration > 0:
                    progress = min(100.0, (seg.end / total_duration) * 100)
                    # Deduplicate: only emit if progress changed by at least 0.1%
                    if progress - last_progress >= 0.1 or progress >= 100.0:
                        last_progress = progress
                        print(f"PROGRESS:{progress:.1f}")
                        sys.stdout.flush()

            text = " ".join(s["text"] for s in segments_list)
            detected_language = info.language or "en"
            duration = segments_list[-1]["end"] if segments_list else 0

            # Ensure 100% progress is emitted if not already
            if last_progress < 100.0:
                print("PROGRESS:100.0")
                sys.stdout.flush()

        else:
            # ---- openai-whisper fallback ----
            print_status("MODEL_LOADING")
            model = whisper.load_model(args.model)
            print_status("TRANSCRIBING")

            transcribe_opts = {}
            if args.language:
                transcribe_opts["language"] = args.language

            result = model.transcribe(file_path, **transcribe_opts)

            text = result.get("text", "").strip()
            detected_language = result.get("language", "en")
            segments = result.get("segments", [])
            duration = segments[-1].get("end", 0) if segments else 0

            # Emit progress for openai-whisper fallback
            if segments:
                total_dur = duration or 1
                for i, seg in enumerate(segments):
                    progress = min(100.0, ((seg.get("end", 0) / total_dur) * 100))
                    print(f"PROGRESS:{progress:.1f}")
                    sys.stdout.flush()

            print("PROGRESS:100.0")
            sys.stdout.flush()

        elapsed = round(time.time() - start_time, 2)

        # 6. Optional Diarization
        speaker_segments = []
        if args.diarize:
            print_status("DIARIZING")
            try:
                from pyannote.audio import Pipeline as DiarizationPipeline

                hf_token = args.hf_token or os.environ.get("HF_TOKEN")
                if not hf_token:
                    raise ValueError("HF_TOKEN required for diarization")

                diarization_pipeline = DiarizationPipeline.from_pretrained(
                    "pyannote/speaker-diarization-3.1",
                    use_auth_token=hf_token,
                )

                diarization = diarization_pipeline(file_path)
                for turn, _, speaker in diarization.itertracks(yield_label=True):
                    speaker_segments.append({
                        "speaker": speaker,
                        "start": round(turn.start, 2),
                        "end": round(turn.end, 2),
                    })

                # Merge speaker labels with transcript segments
                merged_segments = []
                for seg in segments_list:
                    seg_start = seg["start"]
                    seg_end = seg["end"]
                    assigned_speaker = None
                    best_overlap = 0

                    for spk in speaker_segments:
                        overlap_start = max(seg_start, spk["start"])
                        overlap_end = min(seg_end, spk["end"])
                        overlap = max(0, overlap_end - overlap_start)
                        if overlap > best_overlap:
                            best_overlap = overlap
                            assigned_speaker = spk["speaker"]

                    merged_segments.append({
                        **seg,
                        "speaker": assigned_speaker or "Unknown",
                    })

                segments_list = merged_segments
                print("PROGRESS:100.0")
                sys.stdout.flush()
                print_status("COMPLETE")

            except ImportError:
                print("Warning: pyannote.audio not installed. Skipping diarization.", file=sys.stderr)
            except Exception as dia_err:
                print(f"Warning: Diarization failed: {dia_err}. Continuing without speaker labels.", file=sys.stderr)

        else:
            print_status("COMPLETE")

        # Add device info to diagnostics
        diagnostics['device'] = device
        diagnostics['compute_type'] = compute_type
        diagnostics['gpu_name'] = device_info.get('gpu_name')
        diagnostics['cuda_version'] = device_info.get('cuda_version')
        diagnostics['torch_cuda_available'] = device_info.get('torch_cuda_available')
        diagnostics['ct2_cuda_device_count'] = device_info.get('ct2_cuda_device_count')
        diagnostics['ctranslate2_version'] = device_info.get('ct2_version')
        diagnostics['gpu_fallback_reason'] = device_info.get('gpu_fallback_reason')
        diagnostics['audio_duration_seconds'] = total_duration if use_faster else duration
        diagnostics['processing_time_seconds'] = elapsed
        diagnostics['rtf'] = round(elapsed / total_duration, 4) if use_faster and total_duration > 0 else None

        output = {
            "success": True,
            "text": text,
            "language": detected_language,
            "duration": round(duration, 2),
            "wordCount": len(text.split()) if text else 0,
            "engine": "faster-whisper" if use_faster else "openai-whisper",
            "processingTime": elapsed,
            "diagnostics": diagnostics,
            "segments": segments_list if segments_list else None,
            "speakers": list(set(s["speaker"] for s in speaker_segments if "speaker" in s)) if speaker_segments else None,
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