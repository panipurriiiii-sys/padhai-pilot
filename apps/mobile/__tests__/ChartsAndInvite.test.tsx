import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { HBarList, StackedBar } from '../src/components/common/Charts';
import { captureFacultyInvite, usePendingFacultyInvite } from '../src/features/auth/screens/FacultyJoinScreen';

const render = (el: React.ReactElement) => {
  let r: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    r = ReactTestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return JSON.stringify(r!.toJSON());
};

describe('charts', () => {
  it('shows "No data" for null values instead of 0', () => {
    const out = render(<HBarList data={[{ label: 'Maths', value: null }, { label: 'Physics', value: 72 }]} />);
    expect(out).toContain('No data');
    expect(out).toContain('72%');
  });
  it('shows the empty state when there is nothing to stack', () => {
    expect(render(<StackedBar parts={[{ label: 'A', value: 0 }]} emptyMessage="Nothing yet" />)).toContain('Nothing yet');
  });
});

describe('faculty invitation deep link', () => {
  it('captures the token and ignores short or foreign links', () => {
    expect(captureFacultyInvite('padhaipilot://join-faculty?token=' + 'a'.repeat(40))).toBe(true);
    expect(usePendingFacultyInvite.getState().token).toBe('a'.repeat(40));
    usePendingFacultyInvite.getState().set(null);
    expect(captureFacultyInvite('padhaipilot://join-faculty?token=x')).toBe(true);
    expect(usePendingFacultyInvite.getState().token).toBeNull();
    expect(captureFacultyInvite('https://evil.example/join-faculty?token=' + 'a'.repeat(40))).toBe(false);
  });
});
