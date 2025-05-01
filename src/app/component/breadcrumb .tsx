import React from 'react';
import { Breadcrumbs, Link } from '@mui/material';

interface BreadcrumbProps {
  links: { href: string; name: string }[]; // Array of objects with href and name
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ links }) => {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      {links.map((link, index) => (
      <Link key={index} href={link.href} color="inherit" underline="always"  sx={{ textDecoration: 'underline !important' }}>
             {link.name}
    </Link>
    
      ))}
    </Breadcrumbs>
  );
};
 

export default Breadcrumb;
