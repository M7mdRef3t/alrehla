import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SceneImage from './SceneImage.jsx';

describe('SceneImage', () => {
  it('renders image with provided alt', () => {
    render(<SceneImage src="about:blank" alt="Moonlit scene" />);
    const image = screen.getByAltText('Moonlit scene');
    expect(image).toBeTruthy();
  });

  it('announces when image is loaded', () => {
    render(<SceneImage src="about:blank" alt="River at dawn" />);
    const image = screen.getByAltText('River at dawn');
    fireEvent.load(image);
    expect(screen.getByText('Scene image ready: River at dawn')).toBeTruthy();
  });
});
