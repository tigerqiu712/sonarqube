/*
 * SonarQube
 * Copyright (C) 2009-2016 SonarSource SA
 * mailto:contact AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
(function () {

  function WordCloud () {
    this.addField('width', []);
    this.addField('height', []);
    this.addField('maxResultsReached', false);
    window.SonarWidgets.BaseWidget.apply(this, arguments);
  }

  WordCloud.prototype = new window.SonarWidgets.BaseWidget();

  WordCloud.prototype.sizeHigh = 24;

  WordCloud.prototype.sizeLow = 10;

  WordCloud.prototype.formatDirectory = function (path) {
    const dirs = path.split('/');
    if (dirs.length > 2) {
      return '.../' + dirs[dirs.length - 1];
    } else {
      return path;
    }
  };

  WordCloud.prototype.renderWords = function () {
    const that = this;
    const words = this.wordContainer.selectAll('.cloud-word').data(this.components());
    const wordsEnter = words.enter().append('a').classed('cloud-word', true);
    wordsEnter.text(function (d) {
      return d.qualifier === 'DIR' ? that.formatDirectory(d.name) : d.name;
    });
    wordsEnter.attr('href', function (d) {
      return that.options().baseUrl + '?id=' + encodeURIComponent(d.key);
    });
    wordsEnter.attr('title', function (d) {
      return that.tooltip(d);
    });
    words.style('color', function (d) {
      if (that.colorMetric.value(d) != null) {
        return that.color(that.colorMetric.value(d));
      } else {
        return that.colorUnknown;
      }
    });
    words.style('font-size', function (d) {
      return (that.size(that.sizeMetric.value(d))) + 'px';
    });
    return words.sort(function (a, b) {
      if (a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
      } else {
        return -1;
      }
    });
  };

  WordCloud.prototype.render = function (container) {
    const that = this;
    const box = d3.select(container).append('div');
    box.classed('sonar-d3', true);
    box.classed('cloud-widget', true);
    this.wordContainer = box.append('div');
    this.addMetric('colorMetric', 0);
    this.addMetric('sizeMetric', 1);
    this.color = d3.scale.linear().domain([0, 33, 67, 100]);
    if (this.colorMetric.direction === 1) {
      this.color.range(this.colors4);
    } else {
      this.color.range(this.colors4r);
    }
    const sizeDomain = d3.extent(this.components(), function (d) {
      return that.sizeMetric.value(d);
    });
    this.size = d3.scale.linear().domain(sizeDomain).range([this.sizeLow, this.sizeHigh]);
    if (this.maxResultsReached()) {
      const maxResultsReachedLabel = box.append('div').text(this.options().maxItemsReachedMessage);
      maxResultsReachedLabel.classed('max-results-reached-message', true);
    }
    this.renderWords();
    return window.SonarWidgets.BaseWidget.prototype.render.apply(this, arguments);
  };

  window.SonarWidgets.WordCloud = WordCloud;

})();
