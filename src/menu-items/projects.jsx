// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { Home3 } from 'iconsax-react';

// type

// icons
// icons
const icons = {
  project:  Home3,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const projects = {
  id: 'Project Section',
  title: <FormattedMessage id="Projects" />,
  type: 'group',
  children: [
    {
      id: 'Projects',
      title: <FormattedMessage id="All Projects" />,
      type: 'item',
      url: '/project/all',
      icon: icons.project,
      breadcrumbs: false
    },
    {
        id: 'Create Projects',
        title: <FormattedMessage id="Create Projects" />,
        type: 'item',
        url: '/project/create',
        icon: icons.project,
        breadcrumbs: true
    }
      
    
  ]
};

export default projects;


