#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .setup(|app| {
      #[cfg(desktop)]
      app.handle().plugin(
        tauri_plugin_updater::Builder::new()
          .pubkey("dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDM5MjdFRjVDRjE4N0ZBNjUKUlVSbCtvZnhYTzhuT1pyV2d0OXFXOVN5UXhlS1dmNVdiTURBVU0rZGFtS0JLejdhZk1zTUtyTVMK")
          .build()
      )?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}