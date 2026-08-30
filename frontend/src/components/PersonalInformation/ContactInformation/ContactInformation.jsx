import ContactInformationItem from "./ContactInformationItem/ContactInformationItem";

import "./ContactInformation.css";

function ContactInformation({
  category,
  title,
  eyebrow,
  items = [],
  showEmptyItems = false,
}) {
  const visibleItems = showEmptyItems
    ? items
    : items.filter((item) => item.value?.trim());

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section className="contact-information">
      <header className="contact-information-header">
        <div>
          <span className="contact-information-eyebrow">{eyebrow}</span>

          <h4>{title}</h4>
        </div>

        <span className="contact-information-count">{visibleItems.length}</span>
      </header>

      <div className="contact-information-list">
        {visibleItems.map((item, index) => (
          <ContactInformationItem
            key={item.id}
            item={item}
            category={category}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

export default ContactInformation;
