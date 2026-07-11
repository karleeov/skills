# Smoke fixtures

Each `.json` file here is a behavioral test for a skill. The smoke harness
(`npm run smoke`) runs `opencode run --format json --auto` with the fixture's
prompt and checks the assistant output contains the expected substring(s).

## Fixture shape

```json
{
  "skill": "grilling",
  "prompt": "I have a plan to build a cli todo app. Stress-test it for me.",
  "expectContains": ["question"],
  "model": "github-copilot/gpt-5-mini",
  "timeoutMs": 120000
}
```

| field            | type             | required | notes                                                |
| ---------------- | ---------------- | -------- | ---------------------------------------------------- |
| `skill`          | string           | yes      | which skill this exercises (for filtering/reporting) |
| `prompt`         | string           | yes      | sent to the agent                                    |
| `expectContains` | string or string[] | yes    | substring(s) the output must contain (case-insensitive) |
| `model`          | string           | no       | pin a fast model for reproducible runs                  |
| `timeoutMs`      | number           | no       | default 120000                                       |

## Running

```powershell
npm run smoke                       # run all fixtures (calls the model — costs tokens)
npm run smoke -- --dry              # validate fixtures only, no model calls
npm run smoke -- --only grilling    # run fixtures matching a skill
```

## Notes

- Behavioral tests are non-deterministic (model output varies). Keep `expectContains`
  loose — assert on _behaviour the skill must produce_ (e.g. "question" for a grilling
  skill that asks questions), not on exact phrasing.
- CI runs `npm run lint` only. Smoke stays local/opt-in because it needs model access.
- The harness writes temp dirs under `.smoke-cache/` (gitignored).
