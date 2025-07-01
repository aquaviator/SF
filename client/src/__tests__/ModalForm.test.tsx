import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { useForm } from "react-hook-form";
import { ModalForm } from "../components/ModalForm";

const TestForm = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: any) => {
    console.log("Form submitted:", data);
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Test Form"
      form={form}
      onSubmit={onSubmit}
    >
      <div>Test form content</div>
    </ModalForm>
  );
};

describe("ModalForm", () => {
  it("renders when open", () => {
    const mockOnClose = () => {};
    
    render(<TestForm isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText("Test Form")).toBeInTheDocument();
    expect(screen.getByText("Test form content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const mockOnClose = () => {};
    
    render(<TestForm isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText("Test Form")).not.toBeInTheDocument();
  });
});