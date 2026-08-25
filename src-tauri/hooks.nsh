!macro NSIS_HOOK_POSTINSTALL
  ; Context menu for all files: Right click -> "Open with LightRead"
  WriteRegStr SHCTX "Software\Classes\*\shell\LightRead" "" "Open with LightRead"
  WriteRegStr SHCTX "Software\Classes\*\shell\LightRead" "Icon" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  WriteRegStr SHCTX "Software\Classes\*\shell\LightRead\command" "" '$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\"'

  ; Context menu for folders (right click on a folder): "Open folder with LightRead"
  WriteRegStr SHCTX "Software\Classes\Directory\shell\LightRead" "" "Open folder with LightRead"
  WriteRegStr SHCTX "Software\Classes\Directory\shell\LightRead" "Icon" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  WriteRegStr SHCTX "Software\Classes\Directory\shell\LightRead\command" "" '$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\"'

  ; Context menu for folder background (right click empty space inside folder): "Open folder with LightRead"
  WriteRegStr SHCTX "Software\Classes\Directory\Background\shell\LightRead" "" "Open folder with LightRead"
  WriteRegStr SHCTX "Software\Classes\Directory\Background\shell\LightRead" "Icon" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  WriteRegStr SHCTX "Software\Classes\Directory\Background\shell\LightRead\command" "" '$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%V$\"'

  ; Notify Windows Explorer that associations / context menus changed
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Clean up context menu entries on uninstall
  DeleteRegKey SHCTX "Software\Classes\*\shell\LightRead"
  DeleteRegKey SHCTX "Software\Classes\Directory\shell\LightRead"
  DeleteRegKey SHCTX "Software\Classes\Directory\Background\shell\LightRead"

  ; Notify Windows Explorer that associations / context menus changed
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

