# where our npm-installed executables reside
BIN = ../node_modules/.bin

input ?= _input/

# commonly used executables
tito = $(BIN)/tito
datex = $(BIN)/datex

# force TopoJSON to use spherical projections
topo_options ?= --spherical --bbox

# revenue-related files
REVENUE_FILES = \
	national/revenues.tsv \
	state/revenues.tsv \
	county/revenues.tsv \
	offshore/revenues.tsv \
	regional/resource-revenues.tsv \
	regional/revenues.tsv \
	county-revenues-by-state \
	county-resource-revenues-by-state

# production volume files
PRODUCTION_FILES = \
	national/production.tsv \
	state/production.tsv \
	county/production.tsv \
	offshore/production.tsv

# Census-derived export figures
EXPORT_FILES = \
	state/exports-by-industry.tsv

# GDP figures from the Bureau of Economic Analysis
GDP_FILES = \
	gdp/US.tsv \
	gdp/states.tsv

# a list of all of the individual files to build.
# unless otherwise noted, all of these files are broken
# down by year and commodity
FILES = \
	$(REVENUE_FILES) \
	$(PRODUCTION_FILES) \
	$(EXPORT_FILES) \
	geo svg \
	$(GDP_FILES)

all: $(FILES)

revenue: $(REVENUE_FILES)

production: $(PRODUCTION_FILES)

exports: $(EXPORT_FILES)

gdp: $(GDP_FILES)

# national revenues by commodity and revenue type
national/revenues.tsv: state/revenues.tsv offshore/revenues.tsv
	mkdir -p $(dir $@)
	bin/sum.js \
		--group 'Year,Commodity,Type' \
		--sum 'Revenue' \
		-o $@ $^

# national production volumes by commodity and product
national/production.tsv: state/production.tsv offshore/production.tsv
	mkdir -p $(dir $@)
	bin/sum.js \
		--group 'Year,Commodity,Product' \
		--sum 'Volume' \
		-o $@ $^

# national GDP figures
gdp/US.tsv:
	mkdir -p $(dir $@)
	bin/get-bea-data.js --in-topo $(input)geo/us-counties.json --geo us -o $@

# state listing
state/states.tsv: $(input)geo/states.csv
	$(tito) --read csv $< | \
		$(datex) --map '{id: abbr, name: name, FIPS: FIPS}' | \
		$(tito) --write tsv > $@

# state revenues by commodity and revenue type
state/revenues.tsv: county/revenues.tsv
	mkdir -p $(dir $@)
	bin/sum.js \
		--group 'Year,State,Commodity,Type' \
		--sum 'Revenue' \
		-o $@ $<

# state production volumes by commodity and product
state/production.tsv: county/production.tsv
	mkdir -p $(dir $@)
	bin/sum.js \
		--group 'Year,State,Commodity,Product' \
		--sum 'Volume' \
		-o $@ $<

# state GDP figures
gdp/states.tsv:
	mkdir -p $(dir $@)
	bin/get-bea-data.js --in-topo $(input)geo/us-counties.json --geo state -o $@

# state export figures
state/exports-by-industry.tsv: $(input)census/top-state-exports.tsv
	mkdir -p $(dir $@)
	bin/parse-census-commodities.js $< | \
		bin/add-resource-group.js | \
		bin/abbr-state.js --states $(input)geo/states.csv --if tsv --of tsv \
		> $@

# offshore revenues by region and area
offshore/revenues.tsv: $(input)onrr/offshore-revenues.tsv
	mkdir -p $(dir $@)
	bin/group-offshore-revenues.js \
		--keys Year/Region/Area/Commodity/Type \
		$< > $@

# offshore production volumes by region and area
offshore/production.tsv: $(input)onrr/offshore-production.tsv
	mkdir -p $(dir $@)
	bin/group-offshore-production.js \
		--keys Year/Region/Area/Commodity/Product \
		$< > $@

# regional (state and offshore) revenues
regional/revenues.tsv: state/revenues.tsv offshore/revenues.tsv
	mkdir -p $(dir $@)
	bin/union-regions.js \
		--onshore state/revenues.tsv \
		--states $(input)geo/states.csv \
		--offshore offshore/revenues.tsv \
		--areas $(input)geo/offshore/areas.tsv \
		| bin/sum.js \
			--group 'Year,Region,Commodity,Type' \
			--sum 'Revenue' \
			-o $@

# regional (state and offshore) revenues by resource group
regional/resource-revenues.tsv: regional/revenues.tsv
	cat $< \
		| bin/add-resource-group.js \
		| bin/sum.js \
			--group 'Year,Region,Resource' \
			--sum 'Revenue' \
			-o $@

# county listings
county/counties.tsv: geo/us-topology.json
	bin/extract-properties.js --layer counties $< | \
		$(datex) --map '{state: state, name: county, FIPS: FIPS}' | \
		$(tito) --write tsv > $@

# divvy up counties.csv into separate files by state
counties-by-state: county/counties.tsv
	$(tito) --read tsv $< \
		| bin/divvy.js \
			--path 'county/by-state/{{ state }}/counties.tsv' \
			--of tsv

# county revenues
county/revenues.tsv: $(input)onrr/county-revenues.tsv
	mkdir -p $(dir $@)
	$(tito) --read tsv $< \
		| bin/normalize-county-revenues.js \
			--in-states $(input)geo/states.csv \
		| $(tito) --write tsv > $@

# divvy up county revenues into separate files by state
county-revenues-by-state: county/revenues.tsv
	$(tito) --read tsv $< \
		| bin/divvy.js \
			--path 'county/by-state/{{ State }}/revenues.tsv' \
			--of tsv

county-resource-revenues-by-state: county/revenues.tsv
	$(tito) --read tsv $< \
		| bin/add-resource-group.js \
			--if ndjson \
			--of ndjson \
		| bin/sum.js \
			--if ndjson \
			--group 'Year,State,County,FIPS,Resource' \
			--sum 'Revenue' \
			--of ndjson \
		| bin/divvy.js \
			--if ndjson \
			--path 'county/by-state/{{ State }}/resource-revenues.tsv' \
			--of tsv

# county production volumes
county/production.tsv: $(input)onrr/county-production.tsv
	mkdir -p $(dir $@)
	$(tito) --read tsv $< \
		| bin/normalize-county-production.js \
			--in-states $(input)geo/states.csv \
		| $(tito) --write tsv > $@

geo: \
	geo/us-topology.json \
	geo/us-topology-filtered.json \
	geo/us-states.json \
	geo/us-outline.json \
	geo/offshore.json

geo/us-topology.json: $(input)geo/us-10m.json
	mkdir -p $(dir $@)
	bin/map-topology.js \
		--id.states 'abbr' \
		--props.states '{abbr: STATE, FIPS: STATE_FIPS}' \
		--filter.states '["AS", "GU", "PR", "VI"].indexOf(abbr) === -1' \
		--props.counties '{state: STATE, county: COUNTY, FIPS: FIPS}' \
		--filter.counties '["AS", "GU", "PR", "VI"].indexOf(state) === -1' \
		-o $@ -- $<

# generate US topology for only those counties with data
geo/us-topology-filtered.json: county/revenues.tsv geo/us-topology.json
	mkdir -p $(dir $@)
	bin/join-counties.js \
		--in-topo geo/us-topology.json \
		--in-states $(input)geo/states.csv \
		--in-counties county/revenues.tsv \
		--inner \
		> $@

geo/us-outline.json: geo/us-states.json
	$(BIN)/topojson-merge \
		--io states \
		--oo USA \
		--key '"USA"' $< \
		| bin/extract-topology.js --layer USA > $@

geo/us-states.json: geo/us-topology.json
	mkdir -p $(dir $@)
	bin/extract-topology.js \
		--layer states \
		$< > $@

geo/offshore.json: $(input)geo/offshore/*.json
	$(BIN)/topojson $(topo_options) --properties -o $@ -- $^

geo/%-simple.json: geo/%.json
	$(BIN)/topojson $(topo_options) --properties --simplify 1e-8 -o $@ $<

svg: \
	svg/all.svg \
	svg/land.svg \
	svg/states.svg \
	svg/counties.svg \
	svg/offshore.svg \
	svg/filtered.svg

svg/all.svg: \
		geo/us-topology.json \
		geo/offshore.json
	mkdir -p $(dir $@)
	bin/vectorize.js $^ > $@

svg/land.svg: $(input)geo/us-10m.json
	mkdir -p $(dir $@)
	bin/extract-topology.js --layer land $< \
		| bin/vectorize.js /dev/stdin > $@

svg/states.svg: geo/us-states.json
	mkdir -p $(dir $@)
	bin/vectorize.js $< > $@

svg/counties.svg: geo/us-topology.json
	mkdir -p $(dir $@)
	bin/extract-topology.js --layer counties $< \
		| bin/vectorize.js /dev/stdin > $@

svg/offshore.svg: geo/offshore.json
	mkdir -p $(dir $@)
	bin/vectorize.js $< > $@

svg/filtered.svg: geo/us-topology-filtered.json
	mkdir -p $(dir $@)
	bin/vectorize.js $< > $@

svg/outer.svg: geo/us-outline.json geo/offshore.json
	bin/vectorize.js --p0 $^ > $@

$(input)geo/offshore/%.json:
	cd $(input)geo/offshore && make

clean:
	rm -f $(FILES)
	cd $(input)geo/offshore && make clean

distclean: clean
	cd $(input)geo/offshore && make distclean

.PHONY: \
	revenue production exports gdp \
	counties-by-state \
	county-revenues-by-state \
	county-resource-revenues-by-state \
	geo \
	svg
