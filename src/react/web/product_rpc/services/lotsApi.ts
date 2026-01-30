// Lots API Service
const BASE_URL = "/api/product-rpc";

// Helper to get CSRF token from cookies
function getCsrfToken(): string {
  const name = "csrftoken";
  let cookieValue = "";
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export interface LotConfig {
  lot_name: string;
  quantity: number;
  expiration_date?: string;
}

export interface LotsConfig {
  [productId: number]: LotConfig[];
}

export interface PickingMove {
  id: number;
  product_id: number;
  product_name: string;
  product_uom_qty: number;
  tracking: 'none' | 'lot' | 'serial';
  existing_lots: LotConfig[];
}

export interface Picking {
  id: number;
  name: string;
  moves: PickingMove[];
}

export interface ApiResponse<T = any> {
  result: "SUCCESS" | "ERROR";
  message?: string;
  pickings?: T;
  results?: any;
}

export const lotsApi = {
  /**
   * Get pending pickings for a purchase order
   */
  getPendingPickings: async (poId: number): Promise<ApiResponse<Picking[]>> => {
    try {
      const response = await fetch(`${BASE_URL}/purchase_order/${poId}/pickings`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting pending pickings:", error);
      return {
        result: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Generate lots for a specific picking
   */
  generateLots: async (pickingId: number, lotsConfig: LotsConfig): Promise<ApiResponse> => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`${BASE_URL}/picking/${pickingId}/generate_lots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ lots_config: lotsConfig }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating lots:", error);
      return {
        result: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
