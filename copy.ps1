$src = [Environment]::GetFolderPath('UserProfile') + "\.gemini\antigravity\brain\a900a8c9-a02c-4478-b576-ec58bc34f7fc\weberganize_logo_1776134168575.png"
Copy-Item $src "public\logo.png"
Remove-Item $PSCommandPath
