' Double-click de mo VietMindmap (an cua so den)
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run """" & dir & "\launch.bat""", 0, False
