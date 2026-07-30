import { parseJudgmentText } from "@/lib/judgment";

export function JudgmentText({ fullText }: { fullText: string }) {
  const blocks = parseJudgmentText(fullText);

  return (
    <article className="judgment-text" aria-label="Full judgment">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        if (block.kind === "heading") {
          return (
            <h3 className="judgment-text-heading" key={key}>
              {block.text}
            </h3>
          );
        }

        if (block.kind === "judge") {
          return (
            <div className="judgment-text-judge-block" key={key}>
              <h4 className="judgment-text-judge">
                {block.judge}
                {block.text ? `: ${block.text}` : ""}
              </h4>
            </div>
          );
        }

        if (block.kind === "numbered") {
          return (
            <p className="judgment-text-para judgment-text-para--numbered" key={key}>
              <span className="judgment-para-num" aria-hidden="true">
                {block.number}.
              </span>
              {block.text}
            </p>
          );
        }

        return (
          <p className="judgment-text-para" key={key}>
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
