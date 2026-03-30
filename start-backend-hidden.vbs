Set shell = CreateObject("WScript.Shell")
If WScript.Arguments.Count < 1 Then
  WScript.Quit 1
End If

serverPath = WScript.Arguments(0)
cmd = "cmd /c cd /d """ & serverPath & """ && npm run start"

' Run hidden (0), do not wait (False)
shell.Run cmd, 0, False
WScript.Quit 0
