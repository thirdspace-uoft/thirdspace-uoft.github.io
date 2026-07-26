# Client Research Notes

## Brief Summary
- Make the site look very simple.
- Remove decorative treatment and avoid the current AI-generated feel.
- Use the font treatment from the critical NLP reference site.
- Keep only bold emphasis, with 2 to 3 standard text sizes.
- Remove irrelevant homepage metadata such as the volume line.
- Use only the information already shared in the client document and existing site content.

## Reference Sites

### critical-nlp.github.io
- Very minimal editorial homepage.
- Large bold headline, small metadata line, simple body copy.
- System sans typography.
- No decorative cards, shadows, or visual clutter.
- Strong spacing and clear hierarchy do most of the work.

### hci.cs.uwaterloo.ca
- Simple lab-site structure.
- Top navigation, short intro, news, people, and publications.
- Open Sans on the page, but the layout itself stays restrained.
- Publications are listed plainly with title, authors, venue, and year.

## Google Doc Access
- The Google Doc URL opened in Chrome DevTools, but the body content was not readable from the page shell.
- I used `client.md` plus the existing JSON content as the usable source for implementation.

## Implementation Direction
- Replace the current ornate home hero with a plain text-led layout.
- Remove italics and special decorative treatments from the homepage.
- Simplify the publications page into a direct year-grouped list.
- Make the shared navbar, brand mark, and footer match the same restrained language.
- Switch the app typography to a clean system sans and system mono stack.