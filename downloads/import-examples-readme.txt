VoxelVision import examples

TRY WITH SAMPLE ASSETS
1. Download the matched sample CT/PET pair from Settings.
2. identity-lps.tfm: load CT as fixed A and PET as moving B. Put the file in the VoxelVision folder in Files, then choose Load Transform File. Identity preserves the shared coordinate frame; it is not an accuracy reference.
3. trial-manifest.json: put this file in the VoxelVision folder. Tap the main-page banner, then Start. Export the registration to complete the step.
4. sample-batch-manifest.json: first create and save a registration of the sample CT as fixed A and sample PET as moving B, with anchor pairs. Rename this file to batch-manifest.json in the VoxelVision folder. Open Logs & Feedback > Research Batch and choose solve, refine, or benchmark. Merely downloading images does not create a saved registration.
5. Results and records are written under Research; batch outputs go to Research/Runs.

CUSTOMIZE YOUR OWN FILES
The JSON templates are valid JSON syntax but are not ready to run. Replace every REPLACE_WITH value. Do not add // or /* */ comments, and do not add trailing commas.
Rename trial-manifest-template.json to trial-manifest.json, or batch-manifest-template.json to batch-manifest.json after editing. Keep one active file of each name in the VoxelVision folder.

TRIAL FIELDS
schema and schemaVersion: keep unchanged.
studyID: a label identifying your protocol.
trials: one or more pairs; duplicate or remove the supplied entries.
trialID: unique within the file.
order: unique integer within the file; pairs are presented in ascending order.
caseLabel: a neutral label shown to the operator.
fixedUniqueKey / movingUniqueKey: copy complete keys from image details; these are not filenames. Both cases must already be imported. Preserve which case is fixed A and which is moving B.
Optional factors: an object of string-to-string coded labels, preserved in exported records. Omit if unused. Keep reference truth and code-to-condition mappings outside the operator-facing manifest.

BATCH FIELDS
schema and schemaVersion: keep unchanged.
runID: identify the run; use a new ID for a new independent run.
configs: one or more selected saved registrations. Each configID must be unique.
fixedUniqueKey / movingUniqueKey: complete keys identifying an existing saved registration in that direction, with anchors. Import both cases and save the registration first.
allRegistrations: false selects only configs. The separate batch-manifest.json example sets true with an empty configs array to expand all saved registrations with anchors. Do not combine that setting with listed configs unless you intend to include both.
benchmark.repeatCount: number of repetitions of the same input for benchmark mode; the example uses 3. Remove the benchmark object when not needed.
Do not add anchorsFile to a library-key config; those are mutually exclusive input forms.

AFFINE TEMPLATE
affine-lps-template.tfm.txt is an editing scaffold, not an importable transform.
Replace all tokens with numbers, then save as .tfm. Retain the first header line.
Parameters: nine row-major matrix entries, then translation tx ty tz in millimeters.
FixedParameters: center cx cy cz in absolute LPS millimeters.
ITK affine convention: y = M(x - c) + c + t.
VoxelVision expects the ITK fixed-to-moving resampling transform in absolute LPS coordinates. A moving-to-fixed modeling transform must be inverted; a RAS transform also needs coordinate conversion. A 4x4 FSL/FLIRT .mat is not an ITK .tfm.
Prefer exporting a transform from your registration tool rather than entering numeric parameters by hand. Identity is only a format example.

For the complete import locations and formats, see the VoxelVision Support guide.
