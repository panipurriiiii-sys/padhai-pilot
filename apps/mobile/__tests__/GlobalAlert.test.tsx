import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useAlertStore, presentAlert } from '../src/store/useAlertStore';
import { GlobalAlertModal } from '../src/components/common/GlobalAlertModal';
import { ThemeProvider } from '../src/theme/ThemeContext';

describe('GlobalAlert Modal and Store', () => {
  beforeEach(() => {
    act(() => {
      useAlertStore.getState().closeAlert();
    });
  });

  it('renders nothing when there is no active alert', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <GlobalAlertModal />
        </ThemeProvider>,
      );
    });
    expect(renderer?.toJSON()).toBeNull();
  });

  it('displays active success alert with custom title and message', () => {
    act(() => {
      useAlertStore.getState().showSuccess('Action Done', 'Operation completed smoothly.');
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
    act(() => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <GlobalAlertModal />
        </ThemeProvider>,
      );
    });

    const root = renderer?.root;
    expect(root).toBeDefined();

    const titleNode = root?.findByProps({ children: 'Action Done' });
    expect(titleNode).toBeDefined();

    const messageNode = root?.findByProps({ children: 'Operation completed smoothly.' });
    expect(messageNode).toBeDefined();

    act(() => {
      useAlertStore.getState().closeAlert();
    });

    expect(useAlertStore.getState().activeAlert).toBeNull();
  });

  it('supports confirmation alerts with onConfirm callback', () => {
    const onConfirmMock = jest.fn();

    act(() => {
      useAlertStore.getState().showConfirm('Delete Item?', 'This cannot be undone.', onConfirmMock, {
        confirmText: 'Yes, Delete',
        cancelText: 'No, Keep',
        isDestructive: true,
      });
    });

    const current = useAlertStore.getState().activeAlert;
    expect(current).not.toBeNull();
    expect(current?.title).toBe('Delete Item?');
    expect(current?.confirmText).toBe('Yes, Delete');
    expect(current?.cancelText).toBe('No, Keep');
    expect(current?.isDestructive).toBe(true);

    current?.onConfirm?.();
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('presentAlert helper maps Alert.alert style parameters properly', () => {
    const actionMock = jest.fn();

    act(() => {
      presentAlert('Batch Removed', 'All students detached.', [
        { text: 'Okay', onPress: actionMock },
      ]);
    });

    const current = useAlertStore.getState().activeAlert;
    expect(current).not.toBeNull();
    expect(current?.title).toBe('Batch Removed');
    expect(current?.message).toBe('All students detached.');
    expect(current?.confirmText).toBe('Okay');
  });
});
