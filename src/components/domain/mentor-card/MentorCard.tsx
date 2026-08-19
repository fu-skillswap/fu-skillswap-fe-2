import type { Mentor } from "@/models/entities";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function priceLabel(price?: number) {
  return price ? new Intl.NumberFormat("en-US").format(price) : undefined;
}

export function MentorCard({
  mentor,
  onSelect,
}: {
  mentor: Mentor;
  onSelect: (mentor: Mentor) => void;
}) {
  const price = priceLabel(mentor.startingPrice);

  return (
    <article className="figma-mentor-card">
      <span className="figma-mentor-avatar">{initials(mentor.name)}</span>
      <div className="figma-mentor-card-heading">
        <h2>{mentor.name}</h2>
        <p>{mentor.headline ?? `${mentor.expertise[0] ?? "Skill"} mentor`}</p>
        {mentor.organization && <strong>@ {mentor.organization}</strong>}
      </div>
      <div className="figma-mentor-rating">
        <span aria-hidden="true">★</span>
        <strong>{mentor.rating}</strong>
        {mentor.reviewCount !== undefined && (
          <small>({mentor.reviewCount})</small>
        )}
      </div>
      <div className="figma-mentor-skills">
        {mentor.expertise.slice(0, 2).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      {price ? (
        <p className="figma-mentor-price">
          From <strong>{price}</strong> S-coins/30min
        </p>
      ) : (
        <p className="figma-mentor-bio">{mentor.bio}</p>
      )}
      <button
        type="button"
        className="figma-mentor-book"
        onClick={() => onSelect(mentor)}
      >
        View Profile
      </button>
    </article>
  );
}
