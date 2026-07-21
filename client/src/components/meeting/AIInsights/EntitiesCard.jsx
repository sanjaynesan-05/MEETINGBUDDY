import { Tags } from "lucide-react";

export default function EntitiesCard({ keywords, people, organizations, technologies }) {
  const hasKeywords = keywords && keywords.length > 0;
  const hasPeople = people && people.length > 0;
  const hasOrganizations = organizations && organizations.length > 0;
  const hasTechnologies = technologies && technologies.length > 0;

  if (!hasKeywords && !hasPeople && !hasOrganizations && !hasTechnologies) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: "var(--space-6)" }}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)", display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tags size={20} color="var(--md-primary)" />
        Entities & Keywords
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {hasPeople && (
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-2)' }}>People</div>
            <div className="entity-tags">
              {people.map((p, i) => <span key={i} className="entity-tag person">{p}</span>)}
            </div>
          </div>
        )}
        
        {hasOrganizations && (
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-2)' }}>Organizations</div>
            <div className="entity-tags">
              {organizations.map((o, i) => <span key={i} className="entity-tag org">{o}</span>)}
            </div>
          </div>
        )}
        
        {hasTechnologies && (
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-2)' }}>Technologies</div>
            <div className="entity-tags">
              {technologies.map((t, i) => <span key={i} className="entity-tag technology">{t}</span>)}
            </div>
          </div>
        )}
        
        {hasKeywords && (
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--md-on-surface-variant)', marginBottom: 'var(--space-2)' }}>Keywords</div>
            <div className="entity-tags">
              {keywords.map((k, i) => <span key={i} className="entity-tag keyword">{k}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
