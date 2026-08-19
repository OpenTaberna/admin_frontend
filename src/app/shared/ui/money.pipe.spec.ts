import { MoneyPipe } from './money.pipe';

/**
 * The API stores money in minor units. Getting this wrong shows a customer's
 * order as a hundred times its real value, so it is worth pinning down.
 */
describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  it('renders minor units as a major-unit amount', () => {
    expect(pipe.transform(1290)).toContain('12,90');
  });

  it('honours the currency it is given', () => {
    expect(pipe.transform(1000, 'USD')).toContain('$');
  });

  it('renders a dash rather than 0,00 for a missing amount', () => {
    // A blank price and a free product must not look identical.
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('renders an actual zero as zero', () => {
    expect(pipe.transform(0)).toContain('0,00');
  });
});
