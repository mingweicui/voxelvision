# voxelvision.app

Source for the VoxelVision product website at <https://voxelvision.app> — landing page, privacy policy, support (IFU & FAQ), import examples and templates, acknowledgements, and accessibility statement.

**This repository contains the website only. The VoxelVision application source is not public.**

VoxelVision is a native spatial viewer for CT, MR, PET, and NM studies, plus NIfTI and NRRD volumes, for Apple Vision Pro, iPad, and iPhone. For study, research, teaching, and workflow exploration. Not a medical device and not intended for clinical diagnosis or treatment.

Available on the [App Store](https://apps.apple.com/app/voxelvision/id6762214194).

Shared CSS and JavaScript are edited in `assets/site.css`, `assets/site.js`, and `ct.js`. Run `python3 sync_assets.py` after editing them; it writes content-hashed copies and synchronizes every page's references. `python3 sync_assets.py --check` verifies the saved pages and assets. Publishing runs this check before creating the snapshot, so stale references block deployment. Keep older content-hashed assets available for cached HTML.

© 2026 Mingwei Cui
