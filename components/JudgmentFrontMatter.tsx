import type { CaseDetail } from "@/lib/api";
import { counselBySide } from "@/lib/judgment";

function CounselName({ name, rank, lead }: { name: string; rank?: string | null; lead: boolean }) {
  const showRank = rank && !name.includes(rank);
  return (
    <span className="judgment-counsel-name">
      {name}
      {showRank ? `, ${rank}` : ""}
      {lead ? <span className="judgment-counsel-lead">Lead</span> : null}
    </span>
  );
}

export function JudgmentFrontMatter({ item }: { item: CaseDetail }) {
  const counselGroups = counselBySide(item.counsel);
  const reportCite = item.report?.seriesCitation ?? item.citation;
  const showNeutral = Boolean(item.neutralCitation && item.neutralCitation !== reportCite);
  const showAlsoReported = item.citation !== reportCite;
  const hasParties = item.appellant || item.respondent;

  return (
    <section className="judgment-front-matter" aria-label="Report front matter">
      {hasParties && (
        <div className="judgment-fm-block">
          <h3 className="judgment-fm-label">Parties</h3>
          <dl className="judgment-parties-dl">
            {item.appellant && (
              <>
                <dt>Appellant</dt>
                <dd>{item.appellant}</dd>
              </>
            )}
            {item.respondent && (
              <>
                <dt>Respondent</dt>
                <dd>{item.respondent}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      <div className="judgment-fm-grid">
        {item.suitNo && (
          <div className="judgment-fm-item">
            <span className="judgment-fm-label">Suit no.</span>
            <span className="judgment-fm-value">{item.suitNo}</span>
          </div>
        )}
        {item.jurisdiction && (
          <div className="judgment-fm-item">
            <span className="judgment-fm-label">Jurisdiction</span>
            <span className="judgment-fm-value">{item.jurisdiction}</span>
          </div>
        )}
        <div className="judgment-fm-item judgment-fm-item--wide">
          <span className="judgment-fm-label">
            {item.report ? "Report citation" : "Citation"}
          </span>
          <span className="judgment-fm-value judgment-fm-cite">{reportCite}</span>
        </div>
        {showNeutral && (
          <div className="judgment-fm-item">
            <span className="judgment-fm-label">Neutral citation</span>
            <span className="judgment-fm-value">{item.neutralCitation}</span>
          </div>
        )}
        {showAlsoReported && (
          <div className="judgment-fm-item">
            <span className="judgment-fm-label">Also reported</span>
            <span className="judgment-fm-value">{item.citation}</span>
          </div>
        )}
      </div>

      <div className="judgment-fm-block">
        <h3 className="judgment-fm-label">Coram</h3>
        <p className="judgment-fm-coram">{item.judges}</p>
      </div>

      {counselGroups.length > 0 && (
        <div className="judgment-fm-block">
          <h3 className="judgment-fm-label">Counsel</h3>
          <div className="judgment-counsel-groups">
            {counselGroups.map((group) => (
              <div className="judgment-counsel-group" key={group.side}>
                <div className="judgment-counsel-side">{group.label}</div>
                <ul className="judgment-counsel-list">
                  {group.members.map((member) => (
                    <li key={`${group.side}-${member.name}`}>
                      <CounselName name={member.name} rank={member.rank} lead={member.lead} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.issues.length > 0 && (
        <div className="judgment-fm-block">
          <h3 className="judgment-fm-label">Issues for determination</h3>
          <ol className="judgment-issues-list">
            {item.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
