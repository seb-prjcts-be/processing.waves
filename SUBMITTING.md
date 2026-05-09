# Submitting to Processing's Contribution Manager

Notes for getting `processing.waves` listed in Processing 4's IDE
(`Tools > Manage Tools > Libraries`).

## Status

**Not yet submitted.** Testing first. Once the library has been verified
working on at least Windows + macOS by opening each example in the IDE,
follow the steps below.

## How the registry works

Processing's Contribution Manager is fed from a central yaml database in
[processing/processing-contributions](https://github.com/processing/processing-contributions).
After CI runs, that database is converted to a `contribs.txt` the PDE
downloads on startup. Submission is via GitHub issue, validated by a bot
that opens a PR if the metadata is well-formed.

## Required asset layout

The submission bot fetches a `.txt` that mirrors `library.properties`,
hosted next to the `.zip`, with matching base names:

- `https://github.com/seb-prjcts-be/processing.waves/releases/latest/download/waves.zip`
- `https://github.com/seb-prjcts-be/processing.waves/releases/latest/download/waves.txt`

Use the `releases/latest/download/` form so the URL stays stable when
new versions are released.

## Pre-submission checklist

- [ ] Repo is **public** (currently private). The bot needs to fetch
  the assets from public URLs.
- [ ] Release assets renamed to match the library base name:
  - [ ] `waves.zip` (currently `processing.waves-1.0.0.zip`)
  - [ ] `waves.txt` added (copy of `library.properties`)
- [ ] All 6 examples open and run cleanly on Windows + macOS in the
  Processing 4 IDE.
- [ ] `library.properties` reviewed: name/version/authors/url/sentence/
  paragraph all current.
- [ ] Cross-version compatibility check: `compatible = 4.0` is set;
  verify the jar runs on the lowest supported Processing 4.x.
- [ ] License is MIT (already done).

## Submission

1. Open the New Library issue:
   <https://github.com/processing/processing-contributions/issues/new/choose>
2. Pick "New Library".
3. Fill the form:
   - Properties file URL: the `waves.txt` URL above.
   - Home page URL: <https://github.com/seb-prjcts-be/processing.waves>.
   - Guidelines confirmation: tick after re-reading the
     [contribution guidelines](https://github.com/processing/processing/wiki/Library-Guidelines).
4. The bot validates within minutes. If green, a PR is opened against
   `contributions.yaml`. After human review + merge, the library
   appears in the Contribution Manager.

## When releasing a new version

- Build new `waves.jar`, bump `version` and `prettyVersion` in
  `library.properties`.
- Re-upload `waves.zip` + `waves.txt` to the new release.
- Because we use `releases/latest/download/`, no resubmission is
  needed; the Contribution Manager auto-detects the new version.
