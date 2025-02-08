import { lazy } from 'react';

// project-imports
import Loadable from '../components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import PagesLayout from 'layout/Pages';

const MaintenanceError = Loadable(lazy(() => import('pages/maintenance/error/404')));
const MaintenanceError500 = Loadable(lazy(() => import('pages/maintenance/error/500')));
const MaintenanceUnderConstruction = Loadable(lazy(() => import('pages/maintenance/under-construction/under-construction')));
const MaintenanceComingSoon = Loadable(lazy(() => import('pages/maintenance/coming-soon/coming-soon')));

const AppContactUS = Loadable(lazy(() => import('pages/contact-us')));


// render - dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
const DashboardAnalytics = Loadable(lazy(() => import('pages/dashboard/analytics')));
const InvoiceDashboard = Loadable(lazy(() => import('pages/invoice/dashboard')));
const PurchaseDashboard = Loadable(lazy(() => import('pages/purchase/dashboard')));
const ReturnDashboard = Loadable(lazy(() => import('pages/return/dashboard')));
const DamageDashboard = Loadable(lazy(() => import('pages/damage/dashboard')));

const CreateInvoice = Loadable(lazy(() => import('pages/invoice/createInvoice')));
const EditInvoice = Loadable(lazy(() => import('pages/invoice/editInvoice')));
const ListInvoice = Loadable(lazy(() => import('pages/invoice/listInvoice')));
const SalesReport = Loadable(lazy(() => import('pages/invoice/salesReport')));
const InvoiceDetails = Loadable(lazy(() => import('pages/invoice/Invoicedetails')));

const CreatePurchase = Loadable(lazy(() => import('pages/purchase/createPurchase')));
const EditPurchase = Loadable(lazy(() => import('pages/purchase/editPurchase')));
const ListPurchase = Loadable(lazy(() => import('pages/purchase/listPurchases')));
const PurchaseReport = Loadable(lazy(() => import('pages/purchase/purchaseReport')));


const CreateReturn = Loadable(lazy(() => import('pages/return/createReturn')));
const ListReturn = Loadable(lazy(() => import('pages/return/listReturn')));


const CreateDamage = Loadable(lazy(() => import('pages/damage/createDamage')));
const ListDamage = Loadable(lazy(() => import('pages/damage/listDamage')));



const CustomerDashboard = Loadable(lazy(() => import('pages/customer/dashboard')));
const CustomerAccount = Loadable(lazy(() => import('pages/customer/listCustomerAccount')));
const CreateCustomerAccount = Loadable(lazy(() => import('pages/customer/createCustomerAccount')));
const EditCustomerAccount = Loadable(lazy(() => import('pages/customer/editCustomerAccount')));
const BillPayment = Loadable(lazy(() => import('pages/invoice/payment')));



const SupplierAccountList = Loadable(lazy(() => import('pages/supplier/listSupplierAccount')));
const EditSupplierAccount = Loadable(lazy(() => import('pages/supplier/editSupplierAccount')));
const SupplierPayment = Loadable(lazy(() => import('pages/supplier/payment')));


const CreateTransportAccount = Loadable(lazy(() => import('pages/transport/createTransportAccount')));
const TransportAccountList = Loadable(lazy(() => import('pages/transport/listTransportAccount')));
const EditTransportAccount = Loadable(lazy(() => import('pages/transport/editTransportAccount')));
const TransportPayment = Loadable(lazy(() => import('pages/transport/payment')));


const DailyTransactions = Loadable(lazy(() => import('pages/daily/transactions')));
const DailyReport  = Loadable(lazy(() => import('pages/maintenance/coming-soon/coming-soon2')));

const ListPaymentAccount = Loadable(lazy(() => import('pages/main_accounts/listAccount')));
const CreatePaymentAccount = Loadable(lazy(() => import('pages/main_accounts/createAccount')));


const Delivery = Loadable(lazy(() => import('pages/driver/delivery')));


const Allproducts = Loadable(lazy(() => import('pages/products/allProducts')));
const ProductScreen = Loadable(lazy(() => import('pages/products/product')));
const EditProduct = Loadable(lazy(() => import('pages/products/editProducts')));
const PreviewProduct = Loadable(lazy(() => import('pages/products/productPreview')));



const ListAnnouncement = Loadable(lazy(() => import('pages/announcements/ListAnnouncements')));



const StockUpdateScreen = Loadable(lazy(() => import('pages/stock/updateStock')));
const StockRegistry = Loadable(lazy(() => import('pages/stock/stockOpening')));

const TaskBoardScreen = Loadable(lazy(() => import('pages/tasks/taskBoard')));
const TaskBacklogsScreen = Loadable(lazy(() => import('sections/taskBoard/Backlogs')));
const TaskBoardMainScreen = Loadable(lazy(() => import('sections/taskBoard/Board')));



const AppCalendar = Loadable(lazy(() => import('pages/calendar/calendar')));

const AppChat = Loadable(lazy(() => import('pages/chat/chat')));



const AdminEstimate = Loadable(lazy(() => import('pages/adminEstimate/dashboard')));


const Notifications = Loadable(lazy(() => import('pages/notifications/notifications')));

const CreateProject = Loadable(lazy(() => import('pages/project/createProject')));
const ProjectDetails = Loadable(lazy(() => import('pages/project/projectDetails')));
const AllProjects = Loadable(lazy(() => import('pages/project/allProjects')));

// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        {
          path: '/search/category/:category/brand/:brand/size/:size/name/:name/min/:min/max/:max/rating/:rating/order/:order/inStock/:inStock/countInStockMin/:countInStockMin/pageNumber/:pageNumber',
          element: <Allproducts />
        },
        {
          path: 'dashboard',
          children: [
            {
              path: 'default',
              element: <DashboardDefault />
            },
            {
              path: 'analytics',
              element: <DashboardAnalytics />
            }
          ]
        },

        {
          path: 'invoice',
          children: [
            {
              path: 'dashboard',
              element: <InvoiceDashboard />
            },
            {
              path: 'create',
              element: <CreateInvoice />
            },
            {
              path: 'payment',
              element: <BillPayment />
            },
            {
              path: 'details/:id',
              element: <InvoiceDetails />,
            },
            {
              path: 'report',
              element: <SalesReport />
            },
            {
            path: 'edit',
            element: <EditInvoice />,
            children: [
              {
                path: ':id',
                element: <EditInvoice />,
              },
            ]
          },
            {
              path: 'list',
              element: <ListInvoice />
            }
          ]
        },

        {
          path: 'purchase',
          children: [
            {
              path: 'dashboard',
              element: <PurchaseDashboard />
            },
            {
              path: 'create',
              element: <CreatePurchase />
            },
            {
              path: 'report',
              element: <PurchaseReport />
            },
            {
              path: 'edit',
              element: <EditPurchase />,
              children: [
                {
                  path: ':id',
                  element: <EditInvoice />,
                },
              ]
            },
            {
              path: 'list',
              element: <ListPurchase />
            }
          ]
        },

        {
          path: 'return',
          children: [
            {
              path: 'dashboard',
              element: <ReturnDashboard />
            },
            {
              path: 'create',
              element: <CreateReturn />
            },
            {
              path: 'list',
              element: <ListReturn />
            }
          ]
        },

        {
          path: 'damage',
          children: [
            {
              path: 'dashboard',
              element: <DamageDashboard />
            },
            {
              path: 'create',
              element: <CreateDamage />
            },
            {
              path: 'list',
              element: <ListDamage />
            }
          ]
        },

        {
          path: 'customer',
          children: [
            {
              path: 'dashboard',
              element: <CustomerDashboard />
            },
            {
              path: 'account',
              element: <CustomerAccount />
            },
            {
              path: 'create',
              element: <CreateCustomerAccount />
            },
            {
              path: 'edit',
              element: <EditCustomerAccount />,
              children: [
                {
                  path: ':id',
                  element: <EditCustomerAccount />,
                },
              ]
            }
          ]
        },


        {
          path: 'supplier',
          children: [
            {
              path: 'dashboard',
              element: <CustomerDashboard />
            },
            {
              path: 'account',
              element: <SupplierAccountList />
            },
            {
              path: 'create',
              element: <CreateCustomerAccount />
            },
            {
              path: 'payment',
              element: <SupplierPayment />
            },
            {
              path: 'edit',
              element: <EditSupplierAccount />,
              children: [
                {
                  path: ':id',
                  element: <EditSupplierAccount />,
                },
              ]
            }
          ]
        },
        {
          path: 'transport',
          children: [
            {
              path: 'dashboard',
              element: <CustomerDashboard />
            },
            {
              path: 'account',
              element: <TransportAccountList />
            },
            {
              path: 'create',
              element: <CreateTransportAccount />
            },
            {
              path: 'payment',
              element: <TransportPayment />
            },
            {
              path: 'edit',
              element: <EditTransportAccount />,
              children: [
                {
                  path: ':id',
                  element: <EditTransportAccount />,
                },
              ]
            }
          ]
        },
        {
          path: '/tasks',
          element: <TaskBoardScreen />,
          children:[
            {
              path: 'board',
              element: <TaskBoardMainScreen />
            },
            {
              path: 'backlogs',
              element: <TaskBacklogsScreen />
            }
          ]
        },
        {
          path: '/calendar',
          element: <AppCalendar />
        },
        {
          path: '/chat',
          element: <AppChat />
        }
      ]
    },

    {
      path: '/daily',
      element: <DashboardLayout />,
      children: [
        {
          path: 'transactions',
          element: <DailyTransactions />
        },
        {
          path: 'report',
          element: <DailyReport />
        }
      ]
    },

    {
      path: '/accounts',
      element: <DashboardLayout />,
      children: [
        {
          path: 'list',
          element: <ListPaymentAccount />
        },
        {
          path: 'create',
          element: <CreatePaymentAccount />
        }
      ]
    },

    {
      path: '/driver',
      element: <DashboardLayout />,
      children: [
        {
          path: 'delivery',
          element: <Delivery />
        },
        {
          path: 'create',
          element: <CreatePaymentAccount />
        }
      ]
    },

    {
      path: '/products',
      element: <DashboardLayout />,
      children: [
        {
          path: 'all',
          element: <Allproducts />
        },
        {
          path: ':id/preview',
          element: <PreviewProduct />,
        },
        {
          path: 'product',
          element: <ProductScreen />,
          children: [
            {
              path: ':id',
              element: <ProductScreen />
            }
          ]
        },
        {
          path: 'create',
          element: <CreatePaymentAccount />
        },
        {
          path: 'edit',
          element: <EditProduct />,
          children: [
            {
              path: ':id',
              element: <EditProduct />
            }
          ]
        }
      ]
    },

    {
      path: '/announcements',
      element: <DashboardLayout />,
      children:[
        {
          path: 'all',
          element: <ListAnnouncement />
        }
      ]
    },


    {
      path: '/stock',
      element: <DashboardLayout />,
      children:[
        {
          path: 'update',
          element: <StockUpdateScreen />
        },
        {
          path: 'registry',
          element: <StockRegistry />
        }
      ]
    },

    {
      path: '/admin',
      element: <DashboardLayout />,
      children:[
        {
          path: 'invoice',
          element: <AdminEstimate />
        }
      ]
    },

    {
      path: '/notifications',
      element: <DashboardLayout />,
      children:[
        {
          path: 'all',
          element: <Notifications />
        }
      ]
    },

    {

      path: '/project',
      element: <DashboardLayout />,
      children: [
        {
        path: 'create',
        element: <CreateProject />
        },
        {
          path: ':id',
          element: <ProjectDetails />
        },
        {
          path: 'all',
          element: <AllProjects />
        },
      ]

    },



    {
      path: '/maintenance',
      element: <PagesLayout />,
      children: [
        {
          path: '404',
          element: <MaintenanceError />
        },
        {
          path: '500',
          element: <MaintenanceError500 />
        },
        {
          path: 'under-construction',
          element: <MaintenanceUnderConstruction />
        },
        {
          path: 'coming-soon',
          element: <MaintenanceComingSoon />
        }
      ]
    },
    {
      path: '*',
      element: <MaintenanceError />
    }
  ]
};

export default MainRoutes;
