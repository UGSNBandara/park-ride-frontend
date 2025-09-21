## Quick start — download, install, run, remove

Follow these minimal steps to get the project running locally after you've downloaded the project ZIP or cloned the repository.

- Download and extract the ZIP

  - If you downloaded a ZIP from GitHub or another source, extract it to a folder. From PowerShell you can use:

```powershell
# replace .\project.zip with the actual file name
Expand-Archive -Path .\project.zip -DestinationPath .\frontend
Set-Location .\frontend
```

- Install dependencies

  - With npm (recommended):

```powershell
npm install
```

  Note: Vite requires a recent Node.js release. If you see an error like "Vite requires Node.js version 20.19+ or 22.12+", upgrade Node.js to a supported version (for example, install Node 22.x or 20.19+).

- Run the dev server

```powershell
npm run dev
```
