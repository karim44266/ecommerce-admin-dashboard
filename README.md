\# Ecommerce Admin Dashboard

Production-ready ecommerce admin dashboard built with React + Vite + CoreUI.

\## Features

- CoreUI layout shell preserved (sidebar/header/footer + responsive behavior)
- Feature-based modules under `src/modules/*` (Products, Orders, Users, Delivery, Dashboard, Auth)
- API client in `src/services/api.ts` (Axios + `VITE_API_BASE_URL` + JWT interceptor)
- Admin-only route protection via `src/modules/auth/ProtectedRoute.jsx`
- Reusable UI primitives in `src/shared/components/*`

\## Getting Started

\### 1) Install

```bash
npm install
```

\### 2) Configure environment

Copy `.env.example` to `.env` and set your API URL:

```bash
# .env
VITE_API_BASE_URL=http://localhost:3000
```

\### 3) Run

```bash
npm start
```

App runs at `http://localhost:3000`.

\## Build

```bash
npm run build
```

Build output is written to `build/`.

\## Auth Notes

- Token storage: `localStorage['ecom_admin_token']`
- Role storage: `localStorage['ecom_admin_role']`
- The dashboard routes are admin-only; `/login` is public.
- API calls inside feature pages are intentionally placeholders with TODOs until backend endpoints are finalized.

\## Project Structure

```text
src/
	modules/
		auth/
		dashboard/
		products/
		orders/
		users/
		delivery/
	services/
		api.ts
	shared/
		components/
	components/        # CoreUI shell components
	layouts/           # DefaultLayout
	routes/
```

\## License

MIT (see `LICENSE`). This project started from the CoreUI Free React Admin template and was refactored into an ecommerce-focused admin dashboard.

**CoreUI Team**

* <https://twitter.com/core_ui>
* <https://github.com/coreui>
* <https://github.com/orgs/coreui/people>

## Community

Get updates on CoreUI's development and chat with the project maintainers and community members.

- Follow [@core_ui on Twitter](https://twitter.com/core_ui).
- Read and subscribe to [CoreUI Blog](https://coreui.ui/blog/).

## Support CoreUI Development

CoreUI is an MIT-licensed open source project and is completely free to use. However, the amount of effort needed to maintain and develop new features for the project is not sustainable without proper financial backing. You can support development by buying the [CoreUI PRO](https://coreui.io/pricing/?framework=react&src=github-coreui-free-react-admin-template) or by becoming a sponsor via [Open Collective](https://opencollective.com/coreui/).

## Copyright and License

copyright 2025 creativeLabs Łukasz Holeczek.   

Code released under [the MIT license](https://github.com/coreui/coreui-free-react-admin-template/blob/main/LICENSE).