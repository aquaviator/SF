import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCrud } from "../hooks/useCrud";

// Mock the toast hook
jest.mock("../hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const TestComponent = () => {
  const {
    data,
    isLoading,
    isModalOpen,
    editingItem,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
  } = useCrud({
    queryKey: ["/api/test"],
    endpoint: "/api/test",
  });

  return (
    <div>
      <span data-testid="loading">{isLoading.toString()}</span>
      <span data-testid="modal-open">{isModalOpen.toString()}</span>
      <span data-testid="data-count">{data.length}</span>
      <button onClick={openCreateModal}>Open Create</button>
      <button onClick={() => openEditModal({ id: 1, name: "Test" })}>Open Edit</button>
      <button onClick={closeModal}>Close Modal</button>
      <button onClick={() => handleSubmit({ name: "New Item" })}>Submit</button>
      <button onClick={() => handleDelete({ id: 1, name: "Test" })}>Delete</button>
    </div>
  );
};

const renderWithQuery = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe("useCrud", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  it("manages modal state", () => {
    renderWithQuery(<TestComponent />);

    expect(screen.getByTestId("modal-open")).toHaveTextContent("false");

    fireEvent.click(screen.getByText("Open Create"));
    expect(screen.getByTestId("modal-open")).toHaveTextContent("true");

    fireEvent.click(screen.getByText("Close Modal"));
    expect(screen.getByTestId("modal-open")).toHaveTextContent("false");
  });

  it("opens edit modal with item", () => {
    renderWithQuery(<TestComponent />);

    fireEvent.click(screen.getByText("Open Edit"));
    expect(screen.getByTestId("modal-open")).toHaveTextContent("true");
  });

  it("handles delete confirmation", () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    renderWithQuery(<TestComponent />);

    fireEvent.click(screen.getByText("Delete"));
    expect(confirmSpy).toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });
});
