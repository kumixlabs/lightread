!macro NSIS_HOOK_POSTINSTALL
  ; Context menu for all files: Right click -> "Open with LightRead"
  WriteRegStr HKCR "*\shell\LightRead" "" "Open with LightRead"
  WriteRegStr HKCR "*\shell\LightRead" "Icon" "$INSTDIR\LightRead.exe,0"
  WriteRegStr HKCR "*\shell\LightRead\command" "" '"$INSTDIR\LightRead.exe" "%1"'

  ; Context menu for folders (right click on a folder): "Open folder with LightRead"
  WriteRegStr HKCR "Directory\shell\LightRead" "" "Open folder with LightRead"
  WriteRegStr HKCR "Directory\shell\LightRead" "Icon" "$INSTDIR\LightRead.exe,0"
  WriteRegStr HKCR "Directory\shell\LightRead\command" "" '"$INSTDIR\LightRead.exe" "%1"'

  ; Context menu for folder background (right click empty space inside folder): "Open folder with LightRead"
  WriteRegStr HKCR "Directory\Background\shell\LightRead" "" "Open folder with LightRead"
  WriteRegStr HKCR "Directory\Background\shell\LightRead" "Icon" "$INSTDIR\LightRead.exe,0"
  WriteRegStr HKCR "Directory\Background\shell\LightRead\command" "" '"$INSTDIR\LightRead.exe" "%V"'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Clean up context menu entries on uninstall
  DeleteRegKey HKCR "*\shell\LightRead"
  DeleteRegKey HKCR "Directory\shell\LightRead"
  DeleteRegKey HKCR "Directory\Background\shell\LightRead"
!macroend
