// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {  } from 'iconsax-react';
import { Construction } from '@mui/icons-material';

// type

// icons
// icons
const icons = {
  project:  Construction,
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


