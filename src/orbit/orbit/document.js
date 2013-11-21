import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';

var Document = function(data) {
  this.reset(data);
};

Document.prototype = {
  constructor: Document,

  reset: function(data) {
    this._data = data || {};
  },

  retrieve: function(path) {
    return this._retrieve(this._normalizePath(path));
  },

  add: function(path, value) {
    return this._add(this._normalizePath(path), value);
  },

  remove: function(path) {
    return this._remove(this._normalizePath(path));
  },

  replace: function(path, value) {
    return this._replace(this._normalizePath(path), value);
  },

  move: function(fromPath, toPath) {
    return this._move(this._normalizePath(fromPath), this._normalizePath(toPath));
  },

  copy: function(fromPath, toPath) {
    return this._copy(this._normalizePath(fromPath), this._normalizePath(toPath));
  },

  transform: function(operation) {
    if (operation.op === 'add') {
      this.add(operation.path, operation.value);

    } else if (operation.op === 'remove') {
      this.remove(operation.path);

    } else if (operation.op === 'replace') {
      this.replace(operation.path, operation.value);

    } else if (operation.op === 'move') {
      this.move(operation.from, operation.path);

    } else if (operation.op === 'copy') {
      this.copy(operation.from, operation.path);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _normalizePath: function(path) {
    if (typeof path === 'string') {
      if (path.indexOf('/') === 0) path = path.substr(1);
      if (path.length === 0) {
        return undefined;
      } else {
        return path.split('/');
      }
    }
    return path;
  },

  _retrieve: function(path) {
    var ptr = this._data,
        segment;
    if (path) {
      for (var i = 0; i < path.length; i++) {
        segment = path[i];
        if (Object.prototype.toString.call(ptr) === '[object Array]') {
          if (segment === '-') {
            ptr = ptr[ptr.length-1];
          } else {
            ptr = ptr[parseInt(segment, 10)];
          }
        } else {
          ptr = ptr[segment];
        }
        if (ptr === undefined) {
          throw new Document.PathNotFoundException(path.join('/'));
        }
      }
    }
    return ptr;
  },

  _add: function(path, value) {
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, path.length-3));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (parent === '-') {
            grandparent.push(value);
          } else {
            var parentIndex = parseInt(parent, 10);
            if (parentIndex > grandparent.length) {
              throw new Document.PathNotFoundException(path.join('/'));
            } else {
              grandparent.splice(parentIndex, 0, value);
            }
          }
        } else {
          grandparent[parent] = value;
        }
      } else {
        this._data[parent] = value;
      }
    } else {
      this._data = value;
    }
  },

  _remove: function(path) {
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, path.length-3));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parent === '-') {
              grandparent.pop();
            } else {
              var parentIndex = parseInt(parent, 10);
              if (grandparent[parentIndex] === undefined) {
                throw new Document.PathNotFoundException(path.join('/'));
              } else {
                grandparent.splice(parentIndex, 1);
              }
            }
          } else {
            throw new Document.PathNotFoundException(path.join('/'));
          }

        } else if (grandparent[parent] === undefined) {
          throw new Document.PathNotFoundException(path.join('/'));

        } else {
          delete grandparent[parent];
        }
      } else if (this._data[parent] === undefined) {
        throw new Document.PathNotFoundException(path.join('/'));

      } else {
        delete this._data[parent];
      }
    } else {
      this._data = {};
    }
  },

  _replace: function(path, value) {
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, path.length-3));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parent === '-') {
              grandparent[grandparent.length-1] = value;
            } else {
              var parentIndex = parseInt(parent, 10);
              if (grandparent[parentIndex] === undefined) {
                throw new Document.PathNotFoundException(path.join('/'));
              } else {
                grandparent.splice(parentIndex, 1, value);
              }
            }
          } else {
            throw new Document.PathNotFoundException(path.join('/'));
          }

        } else if (grandparent[parent] === undefined) {
          throw new Document.PathNotFoundException(path.join('/'));

        } else {
          grandparent[parent] = value;
        }
      } else if (this._data[parent] === undefined) {
        throw new Document.PathNotFoundException(path.join('/'));

      } else {
        this._data[parent] = value;
      }
    } else {
      this._data = value;
    }
  },

  _move: function(fromPath, toPath) {
    var value = this._retrieve(fromPath);
    this._remove(fromPath);
    this._add(toPath, value);
  },

  _copy: function(fromPath, toPath) {
    this._add(toPath, this._retrieve(fromPath));
  }
};

Document.PathNotFoundException = function(path) {
  this.path = path;
};
Document.PathNotFoundException.prototype = {
  constructor: 'PathNotFoundException'
};

export default Document;