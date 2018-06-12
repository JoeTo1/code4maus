import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './button-with-icon.css';

const ButtonWithIconComponent = ({
  className,
  iconClassName,
  iconSrc,
  children,
  onClick,
  ...props
}) => {

  const icon = iconSrc && (
      <img
          className={classNames(iconClassName, styles.icon)}
          draggable={false}
          src={iconSrc}
      />
  );

  return (
      <button
          className={classNames(className, styles.button)}
          onClick={onClick}
          {...props}
      >
        <div className={styles.content}>{children}</div>
          {icon}
      </button>
  );
};

ButtonWithIconComponent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  iconSrc: PropTypes.string,
  onClick: PropTypes.func
};

export default ButtonWithIconComponent;