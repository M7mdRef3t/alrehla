Set-StrictMode -Version Latest
Set-Location 'C:\Users\ty\Downloads\Dawayir-main\Dawayir-main'
try {
  takeown /F ".\node_modules\@tailwindcss\oxide-win32-x64-msvc\tailwindcss-oxide.win32-x64-msvc.node" /A /R | Out-Null
  icacls ".\node_modules\@tailwindcss\oxide-win32-x64-msvc\tailwindcss-oxide.win32-x64-msvc.node" /grant Administrators:F /C | Out-Null
} catch { }
Try { Remove-Item -LiteralPath '.\node_modules\@tailwindcss\oxide-win32-x64-msvc' -Recurse -Force -ErrorAction SilentlyContinue } catch { }
Try { npx rimraf node_modules --no-install } catch { }
