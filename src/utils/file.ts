export class FileUtil {
  static convert(bytes: number, decimalPlaces = 0): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    let index = 0
    let size = bytes
    while (size >= 1024) {
      size /= 1024
      index++
    }
    return `${size.toFixed(decimalPlaces)} ${units[index]}`
  }
}
