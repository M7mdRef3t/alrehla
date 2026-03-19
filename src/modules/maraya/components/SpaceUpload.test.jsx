import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SpaceUpload from './SpaceUpload';

const uiText = {
  back: 'Back',
  uploadTitle: 'Upload your space',
  uploadDesc: 'Choose an image',
  uploadDrop: 'Upload an image',
  analyzingSpace: 'Analyzing...',
};

const originalFileReader = global.FileReader;
const originalImage = global.Image;
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

let drawImageMock;

function installFileReaderMock(result = 'data:image/png;base64,mocked-image-data') {
  global.FileReader = class {
    constructor() {
      this.onload = null;
    }

    readAsDataURL() {
      setTimeout(() => {
        this.onload?.({ target: { result } });
      }, 0);
    }
  };
}

function installImageMock(width, height) {
  global.Image = class {
    constructor() {
      this.onload = null;
      this.width = width;
      this.height = height;
      setTimeout(() => {
        this.onload?.();
      }, 0);
    }

    set src(_) {}
  };
}

describe('SpaceUpload', () => {
  const onUpload = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    onUpload.mockReset();
    onBack.mockReset();
    drawImageMock = vi.fn();

    installFileReaderMock();
    installImageMock(100, 100);

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: drawImageMock,
    }));
    HTMLCanvasElement.prototype.toDataURL = vi.fn(
      () => 'data:image/jpeg;base64,processed-image-content',
    );
  });

  afterEach(() => {
    global.FileReader = originalFileReader;
    global.Image = originalImage;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    vi.restoreAllMocks();
  });

  it('renders an accessible file input and upload copy', () => {
    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    const input = screen.getByLabelText(/upload an image/i);
    expect(input).toBeTruthy();
    expect(input.disabled).toBe(false);
    expect(input.classList.contains('visually-hidden')).toBe(true);
    expect(screen.getByText(uiText.uploadTitle)).toBeTruthy();
    expect(screen.getByText(uiText.uploadDesc)).toBeTruthy();
  });

  it('is disabled when the disabled prop is true', () => {
    render(
      <SpaceUpload
        onUpload={onUpload}
        onBack={onBack}
        uiText={uiText}
        disabled={true}
      />,
    );

    const input = screen.getByLabelText(/upload an image/i);
    expect(input.disabled).toBe(true);
  });

  it('calls onBack when the back button is clicked', () => {
    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('processes a valid uploaded image and shows the preview state', async () => {
    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    const input = screen.getByLabelText(/upload an image/i);
    const file = new File(['image'], 'room.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith('processed-image-content', 'image/jpeg');
    });

    expect(screen.getByText(uiText.analyzingSpace)).toBeTruthy();
    expect(screen.getByAltText('Preview')).toBeTruthy();
  });

  it('ignores invalid file types', () => {
    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    const input = screen.getByLabelText(/upload an image/i);
    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onUpload).not.toHaveBeenCalled();
  });

  it('toggles drag state classes while dragging files over the dropzone', () => {
    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    const dropzone = screen.getByText(uiText.uploadDrop).closest('label');
    expect(dropzone).toBeTruthy();

    fireEvent.dragOver(dropzone);
    expect(dropzone.classList.contains('space-upload__dropzone--active')).toBe(true);

    fireEvent.dragLeave(dropzone);
    expect(dropzone.classList.contains('space-upload__dropzone--active')).toBe(false);
  });

  it('processes a file dropped on the dropzone', async () => {
    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    const dropzone = screen.getByText(uiText.uploadDrop).closest('label');
    const file = new File(['image'], 'room.png', { type: 'image/png' });

    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith('processed-image-content', 'image/jpeg');
    });

    expect(dropzone.classList.contains('space-upload__dropzone--active')).toBe(false);
  });

  it('rescales wide images to the maximum canvas size before upload', async () => {
    installImageMock(2000, 1000);

    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    const input = screen.getByLabelText(/upload an image/i);
    const file = new File(['wide'], 'wide.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(drawImageMock).toHaveBeenCalled();
    });

    expect(drawImageMock).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 512);
  });

  it('rescales tall images to the maximum canvas size before upload', async () => {
    installImageMock(1000, 2000);

    render(
      <SpaceUpload onUpload={onUpload} onBack={onBack} uiText={uiText} />,
    );

    const input = screen.getByLabelText(/upload an image/i);
    const file = new File(['tall'], 'tall.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(drawImageMock).toHaveBeenCalled();
    });

    expect(drawImageMock).toHaveBeenCalledWith(expect.anything(), 0, 0, 512, 1024);
  });
});
