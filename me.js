/* ─────────────────────────────────────────────────────────────────────────
 * THE LISTS YOU CAN EDIT
 *
 * Everything in "Off the clock" comes from this file. To add something,
 * add a line, save, commit and push. It then shows up for everyone.
 *
 * SPORTS: just the name, in quotes, with a comma after it.
 *
 * GENRES: a name and a "feel". The feel sets how the equaliser moves:
 *
 *   heavy   fast and jagged          (metal, punk, hardcore)
 *   bass    slow with big low hits   (dubstep, rap, trap)
 *   bounce  steady and punchy        (pop, house, electronic)
 *   chill   slow and smooth          (country, lo-fi, jazz)
 *   wild    all over the place       (anything chaotic)
 *
 * Example, to add drum and bass:   { name: "Drum & Bass", feel: "wild" },
 * ───────────────────────────────────────────────────────────────────────── */

window.ME = {

  sports: [
    "Basketball",
    "Hockey",
    "Football",
    "Tennis",
    "Skateboarding",
  ],

  genres: [
    { name: "Metal",      feel: "heavy"  },
    { name: "Rap",        feel: "bass"   },
    { name: "Pop",        feel: "bounce" },
    { name: "Country",    feel: "chill"  },
    { name: "Electronic", feel: "bounce" },
    { name: "Dubstep",    feel: "bass"   },
  ],

};
