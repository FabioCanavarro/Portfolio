import AdminGalleryClient from "./AdminGalleryClient";

export const metadata = {
  title: "Gallery Admin | Fabio Canavarro",
  description: "Manage and upload photos for the gallery.",
};

export default function GalleryAdminPage() {
  return <AdminGalleryClient />;
}
