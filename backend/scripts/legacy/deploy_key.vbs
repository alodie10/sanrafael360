Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c type id_rsa.pub | ssh -p 65002 u269831255@153.92.220.132 ""mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"""
WScript.Sleep 3000
WshShell.SendKeys "DcaDca_0111#{ENTER}"
