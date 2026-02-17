// Purchase Order API Service
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

export interface PurchaseOrderSearchResult {
  id: number;
  name: string;
  partner_name: string;
  partner_ref: string;
  date_order: string;
  amount_total: number;
  state: string;
  company_id: number;
}

export interface ApiResponse<T = any> {
  result: "SUCCESS" | "ERROR";
  message?: string;
  order?: T;
}

export const purchaseOrderApi = {
  /**
   * Search for purchase order by name
   */
  searchByName: async (
    orderName: string
  ): Promise<ApiResponse<PurchaseOrderSearchResult>> => {
    try {
      const response = await fetch(
        `${BASE_URL}/purchase_order/search/${encodeURIComponent(orderName)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching purchase order:", error);
      return {
        result: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get purchase order details for editing
   */
  getForEdit: async (poId: number): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/purchase_order/${poId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting purchase order:", error);
      return {
        result: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Update existing purchase order
   */
  update: async (poId: number, orderData: any): Promise<ApiResponse> => {
    try {
      console.log("🌐 [API] purchaseOrderApi.update() llamado");
      console.log("🌐 [API] PO ID:", poId);
      console.log("🌐 [API] Order Data:", orderData);
      
      const csrfToken = getCsrfToken();
      console.log("🔑 [API] CSRF Token:", csrfToken);

      const url = `${BASE_URL}/purchase_order/${poId}`;
      console.log("🌐 [API] URL:", url);
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(orderData),
      });

      console.log("📡 [API] Response status:", response.status);
      console.log("📡 [API] Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [API] Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();
      console.log("✅ [API] JSON Response:", jsonResponse);
      
      return jsonResponse;
    } catch (error) {
      console.error("❌ [API] Error en update:", error);
      return {
        result: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
