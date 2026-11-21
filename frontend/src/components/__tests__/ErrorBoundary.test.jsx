import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../common/ErrorBoundary';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function BrokenChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Crash simulé');
  }
  return <div>Contenu sain</div>;
}

describe('ErrorBoundary', () => {
  it('capture une erreur de rendu et permet de reinitialiser via Reessayer', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    const { rerender } = render(
      <ErrorBoundary onError={onError}>
        <BrokenChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Une erreur d'affichage est survenue/i)).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);

    rerender(
      <ErrorBoundary onError={onError}>
        <BrokenChild shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(screen.getByText('Contenu sain')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
