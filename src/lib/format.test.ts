import {
  formatPercent,
  formatPrice,
  formatPriceUsd,
  formatSize,
  formatVolume,
  formatTime,
} from "./format";

describe("format", () => {
  test("formatPrice respects decimals", () => {
    expect(formatPrice(1234.5, 2)).toBe("1,234.50");
    expect(formatPrice(0.000123, 6)).toBe("0.000123");
  });

  test("formatPriceUsd prepends $ sign", () => {
    expect(formatPriceUsd(96432.5, 1)).toBe("$96,432.5");
  });

  test("formatVolume bucketizes", () => {
    expect(formatVolume(950)).toBe("950.00");
    expect(formatVolume(2_345)).toBe("2.35K");
    expect(formatVolume(8_700_000)).toBe("8.70M");
    expect(formatVolume(2_500_000_000)).toBe("2.50B");
  });

  test("formatPercent adds sign", () => {
    expect(formatPercent(2.34)).toBe("+2.34%");
    expect(formatPercent(-1.5)).toBe("-1.50%");
    expect(formatPercent(0)).toBe("0.00%");
  });

  test("formatSize fixed decimals", () => {
    expect(formatSize(1.23456, 3)).toBe("1.235");
  });

  test("formatTime hh:mm:ss", () => {
    // 1990-01-01T12:34:56Z
    const d = new Date("1990-01-01T12:34:56");
    expect(formatTime(d.getTime())).toBe("12:34:56");
  });

  test("non-finite returns em-dash", () => {
    expect(formatPrice(NaN)).toBe("—");
    expect(formatVolume(Infinity)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });
});
