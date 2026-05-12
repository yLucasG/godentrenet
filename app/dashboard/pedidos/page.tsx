import { getStoreOrders } from "@/actions/orders-dashboard";
import { OrdersClient } from "./OrdersClient";

export default async function PedidosPage() {
  const orders = await getStoreOrders();
  return <OrdersClient initialOrders={orders} />;
}
