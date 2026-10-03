# Skunk bomb and attack concepts — 3 October 2026

Status: **owner accepted revision 2 poses and motion study 01**.
Owner selected A's underhand action with B's flask, twice the bomb size and bright
neon green for visibility. After seeing revision 2, owner confirmed: “confirmed
that looks good, lets start with that.” After reviewing the motion study, the
owner said “animation is sufficient, proceed.” Gas and battlefield approval remain
separate gates. The owner subsequently selected **B — soft puffs**, with no
“Poisoned” text: poison is conveyed by the visuals alone. Battlefield approval
remains pending. See [effect selection](effects/README.md).

## Revision 2 — enlarged neon flask

[Revised pose sheet](underhand-neon-flask-v2.png) combines A's four underhand
poses with B's corked flask. The prompt interprets 2× as doubled linear dimensions
relative to the unchanged character, and changes the ceramic surface to neon lime
green. Generated concept sizing remains approximate; exact runtime dimensions
will be set during the later approved rig work. Bright colour does not authorize
glow, gas opacity or an effect design.

Built-in ImageGen edited A using B as the flask reference. Exact input is retained
in [revision-v2-prompt.txt](revision-v2-prompt.txt). Output is unmodified review
evidence. Visual inspection: silhouette and colour are clearer, the face remains
visible, and feet remain grounded. Preparation grip wraps the side of the flask;
the eventual rig must ensure support underneath and continuous handoff. Mirrored
game-scale comparison and explicit pose acceptance remain before motion.

## Candidates

| Sheet | Payload | Action | Review tradeoff |
| --- | --- | --- | --- |
| [A](a-underhand-v1.png) | Ochre ceramic seedpod with green cap | One-paw underhand lob | Clear face and distinct low preparation; the leaf/acorn appearance may suggest food rather than a poison bomb. |
| [B](b-overhand-v1.png) | Green corked ceramic flask | Compact shoulder toss | Strong preparation and familiar bomb silhouette; release arm overlaps the lower face. |
| [C](c-scoop-v1.png) | Leaf-wrapped parcel | Two-paw forward scoop | Clear supported weight; more similar to Turtle, with a busier small-scale payload silhouette. |

The prop and action choices can be combined. All are fictional impact-burst props.
No gas has been designed or approved yet.

## Inspection and next gate

Inspected all three native ImageGen outputs. Each depicts ready, preparation,
release and follow-through, with visible payload support before release and a
departed payload afterward. These drawings explore intent, not finished rig parts.
They vary in body/tail proportions, head angle, boot placement and shoulder seams;
do not replace the existing whole body with these generated frames. B's release
is already somewhat past the desired exact handoff instant. A's release is higher
than the hip-level research starting point. C compresses the body for preparation.
Those were initial review points; the owner's subsequent acceptance applies to
revision 2, not to all three initial candidates.

First ask the owner to select/refine bomb appearance and action. Then make a
focused coherent pose revision and compare against the original at equal body
height, close-up and game scale, east and mirrored west. Obtain explicit pose
approval before developing motion. Later motion review needs play/pause, slow
playback and scrubbing; gas and actual battlefield approval remain separate.

## Provenance

- Generator: built-in ImageGen, three independent calls; no API/CLI fallback.
- Identity input: `public/art/v2/skunk-side-defender-v1/body.webp`; source and crop
  provenance remain in that asset's `rig.json` and `prompt.txt`.
- Exact shared prompt and per-candidate additions: [prompts.md](prompts.md).
- Primary references and observed mechanics versus stylization: [research.md](research.md).
- PNGs are unmodified generator outputs, retained as review evidence only.
- A SHA-256: `55dbb93aa5237c3b1c08252e4edebfc5f7c8bc233706c77f68109a4c4c79dd12`.
- B SHA-256: `6fda0030060b9a9d51cf41739142c1ebeca17c36b1d84fe7f92cc629b881f421`.
- C SHA-256: `4b9a465eaac7d5e848e27e2d9bb2b191bc7d4912878e7b7e4b7af931d82ff64d`.

The initial concept stage changed no runtime code. The subsequent accepted motion
and effects are now integrated into the renderer; canonical content and combat
rules are unchanged. See [runtime verification](battlefield/README.md).
