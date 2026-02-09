import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@mui/material';

export default function Breadcrumb({ items, sx = {} }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Breadcrumbs
      separator='›'
      aria-label='breadcrumb'
      sx={{
        '& .MuiBreadcrumbs-separator': {
          mx: 1,
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          fontWeight: 'bold',
          '&:hover': { textDecoration: 'underline' },
        },
        ...sx,
      }}
    >
      {items.map((item, index) => {
        return (
          <Link key={index} to={item.href}>
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
