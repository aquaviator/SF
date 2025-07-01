import React from "react";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { ModalForm } from "../components/ModalForm";

const TestModalForm = ({ isOpen = true, onSubmit = jest.fn() }) => {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={jest.fn()}
      title="Test Modal"
      form={form}
      onSubmit={onSubmit}
    >
      <div>Test Form Content</div>
    </ModalForm>
  );
};

describe("ModalForm", () => {
  it("renders when open", () => {
    render(<TestModalForm />);
    
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Test Form Content")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<TestModalForm isOpen={false} />);
    
    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    const TestLoadingModal = () => {
      const form = useForm();
      return (
        <ModalForm
          isOpen={true}
          onClose={jest.fn()}
          title="Test Modal"
          form={form}
          onSubmit={jest.fn()}
          isLoading={true}
        >
          <div>Content</div>
        </ModalForm>
      );
    };

    render(<TestLoadingModal />);
    
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });
});
