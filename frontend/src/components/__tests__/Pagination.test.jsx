import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../common/Pagination';

describe('Pagination', () => {
  it('ne rend rien lorsqu une seule page suffit', () => {
    const { container } = render(<Pagination page={1} limit={12} total={8} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche les controles de pagination, l etat actif et appelle onPageChange', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} limit={12} total={30} onPageChange={onPageChange} />);

    expect(screen.getByText(/30 événements/i)).toBeInTheDocument();

    const activeBtn = screen.getByRole('button', { name: 'Page 2' });
    expect(activeBtn).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: 'Page précédente' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('desactive Suivant sur la derniere page', () => {
    render(<Pagination page={3} limit={12} total={30} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Page suivante' })).toBeDisabled();
  });
});
