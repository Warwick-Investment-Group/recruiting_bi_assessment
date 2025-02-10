import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

# Page config
st.set_page_config(page_title="Well Production Analysis", layout="wide")

# Add title
st.title("Well Production Analysis Dashboard")

# Cache data loading
@st.cache_data
def load_data():
    wells_df = pd.read_csv('../well_metadata.csv')
    prod_df = pd.read_csv('../production_data.csv')
    fail_df = pd.read_csv('../failure_events.csv')
    
    # Convert date columns
    prod_df['date'] = pd.to_datetime(prod_df['date'])
    fail_df['date'] = pd.to_datetime(fail_df['date'])
    wells_df['completionDate'] = pd.to_datetime(wells_df['completionDate'])
    
    return wells_df, prod_df, fail_df

# Load data
wells_df, prod_df, fail_df = load_data()

# Sidebar filters
st.sidebar.header("Filters")
selected_region = st.sidebar.multiselect(
    "Select Region",
    options=wells_df['region'].unique(),
    default=wells_df['region'].unique()
)

date_range = st.sidebar.date_input(
    "Select Date Range",
    value=(prod_df['date'].min(), prod_df['date'].max()),
    min_value=prod_df['date'].min(),
    max_value=prod_df['date'].max()
)

# Filter data based on selections
mask = (prod_df['region'].isin(selected_region)) & \
       (prod_df['date'].dt.date >= date_range[0]) & \
       (prod_df['date'].dt.date <= date_range[1])
filtered_prod = prod_df[mask]

# Calculate KPIs
col1, col2, col3, col4 = st.columns(4)

with col1:
    total_oil = filtered_prod['oilProduction'].sum()
    st.metric("Total Oil Production", f"{total_oil:,.0f} BBL")

with col2:
    total_gas = filtered_prod['gasProduction'].sum()
    st.metric("Total Gas Production", f"{total_gas:,.0f} MCF")

with col3:
    avg_runtime = filtered_prod['runtime'].mean()
    st.metric("Average Runtime", f"{avg_runtime:.1f} days")

with col4:
    failure_count = len(fail_df[fail_df['date'].dt.date.between(date_range[0], date_range[1])])
    st.metric("Equipment Failures", failure_count)

# Create tabs for different analyses
tab1, tab2, tab3 = st.tabs(["Production Analysis", "Well Location Map", "Runtime Analysis"])

with tab1:
    # Monthly production trends
    monthly_prod = filtered_prod.groupby('date').agg({
        'oilProduction': 'sum',
        'gasProduction': 'sum',
        'waterProduction': 'sum'
    }).reset_index()

    fig = make_subplots(specs=[[{"secondary_y": True}]])

    fig.add_trace(
        go.Scatter(x=monthly_prod['date'], y=monthly_prod['oilProduction'],
                  name="Oil Production", line=dict(color='green')),
        secondary_y=False
    )

    fig.add_trace(
        go.Scatter(x=monthly_prod['date'], y=monthly_prod['gasProduction'],
                  name="Gas Production", line=dict(color='red')),
        secondary_y=True
    )

    fig.update_layout(title="Monthly Production Trends",
                     xaxis_title="Date",
                     yaxis_title="Oil Production (BBL)",
                     yaxis2_title="Gas Production (MCF)")

    st.plotly_chart(fig, use_container_width=True)

with tab2:
    # Well location map
    fig = px.scatter_mapbox(wells_df[wells_df['region'].isin(selected_region)],
                           lat='latitude',
                           lon='longitude',
                           color='region',
                           hover_data=['wellId', 'initialOilRate', 'initialGasRate'],
                           zoom=7,
                           title="Well Locations")
    
    fig.update_layout(mapbox_style="open-street-map")
    st.plotly_chart(fig, use_container_width=True)

with tab3:
    # Runtime analysis
    col1, col2 = st.columns(2)
    
    with col1:
        # Runtime distribution
        fig = px.histogram(filtered_prod, x='runtime',
                          title="Runtime Distribution",
                          labels={'runtime': 'Runtime (days)'})
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Runtime anomalies
        anomalies = filtered_prod[
            (filtered_prod['runtime'] > 31) | 
            (filtered_prod['runtime'] == 0)
        ].sort_values('date')
        
        st.subheader("Runtime Anomalies")
        st.dataframe(
            anomalies[['wellId', 'date', 'runtime']],
            use_container_width=True
        )

# Footer with data quality metrics
st.markdown("---")
st.subheader("Data Quality Metrics")
col1, col2, col3 = st.columns(3)

with col1:
    missing_data = filtered_prod.isnull().sum()
    st.metric("Missing Values", missing_data.sum())

with col2:
    runtime_issues = len(filtered_prod[
        (filtered_prod['runtime'] > 31) | 
        (filtered_prod['runtime'] == 0)
    ])
    st.metric("Runtime Anomalies", runtime_issues)

with col3:
    zero_prod = len(filtered_prod[
        (filtered_prod['runtime'] > 0) & 
        (filtered_prod['oilProduction'] == 0) & 
        (filtered_prod['gasProduction'] == 0)
    ])
    st.metric("Zero Production Days", zero_prod)
