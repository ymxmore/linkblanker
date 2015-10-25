var MaterialUi = require('material-ui');
var Styles = MaterialUi.Styles;
var Theme = Styles.LightRawTheme;
var assign = require('object-assign');

module.exports = {
  wrapper: {
    backgroundColor: Theme.canvasColor,
    color: Theme.textColor,
    fontFamily: "Helvetica 'Hiragino Kaku Gothic Pro', sans'-serif",
    fontSize: 14,
    lineHeight: '2em',
    minWidth: 380,
    padding: 10,
  },

  extensionName: {
    width: '100%',
    height: 64,
    background: 'url("/img/logo.svgz") 60px 0 scroll no-repeat',
    position: 'relative',
  },

  typographyMidium: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: Theme.borderColor,
    lineHeight: 36,
  },

  icon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '48',
    height: '48',
  },

  versionName: {
    display: 'inline-block',
    position: 'absolute',
    bottom: 0,
    left: 60,
  },

  listItem: {
    listStyleType: 'none',
    display: 'block',
    padding: '0 0 .3em 0',
    margin: '0 0 .6em 0',
  },

  listItemFirst: assign({}, this.listItem, {
    padding: 0,
    margin: 0,
  }),

  split: {
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: Theme.borderColor,
    paddingTop: '.9em',
  },
};
