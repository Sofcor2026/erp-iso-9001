import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Crumb {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    crumbs: Crumb[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ crumbs }) => {
    if (!crumbs || crumbs.length === 0) {
        return null;
    }

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                {crumbs.map((crumb, index) => (
                    <li key={index} className="inline-flex items-center">
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                        )}
                        {crumb.path ? (
                            <NavLink
                                to={crumb.path}
                                className="inline-flex items-center font-medium text-gray-500 hover:text-brand-primary"
                            >
                                {crumb.label}
                            </NavLink>
                        ) : (
                            <span className="font-medium text-gray-700" aria-current="page">
                                {crumb.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
