use std::time::Duration;

fn main() {
    let dir = std::env::args().nth(1).expect("usage: watchtest <dir>");
    let (tx, rx) = std::sync::mpsc::channel();
    let mut debouncer =
        notify_debouncer_mini::new_debouncer(Duration::from_millis(500), move |res: notify_debouncer_mini::DebounceEventResult| {
            if res.is_ok() {
                let _ = tx.send(());
            }
        })
        .unwrap();
    debouncer
        .watcher()
        .watch(
            std::path::Path::new(&dir),
            notify_debouncer_mini::notify::RecursiveMode::Recursive,
        )
        .unwrap();
    println!("watching {dir} — reading listing every 700ms for 5s…");
    let start = std::time::Instant::now();
    let mut ticks = 0;
    while start.elapsed() < Duration::from_secs(5) {
        std::thread::sleep(Duration::from_millis(700));
        let n = std::fs::read_dir(&dir).map(|rd| rd.count()).unwrap_or(0);
        ticks += 1;
        println!("read #{ticks}: {n} entries");
        while rx.try_recv().is_ok() {
            println!("  >>> EVENT emitted (read-triggered!)");
        }
    }
    println!("done");
}
